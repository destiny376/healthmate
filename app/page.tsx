"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Heart,
  Moon,
  Utensils,
  Footprints,
  Brain,
  SendHorizontal,
} from "lucide-react";

type HealthDay = {
  day: string;
  steps: number;
  sleep: number;
  diet: string;
};

type Message = { role: "user" | "ai"; text: string };

const defaultHealthData: HealthDay[] = [
  { day: "Mon", steps: 8200, sleep: 7, diet: "早餐：鸡蛋；午餐：米饭+蔬菜；晚餐：面条" },
  { day: "Tue", steps: 9000, sleep: 6.5, diet: "早餐：燕麦；午餐：炒饭；晚餐：鸡肉沙拉" },
  { day: "Wed", steps: 7600, sleep: 8, diet: "早餐：牛奶+面包；午餐：面条；晚餐：鱼" },
  { day: "Thu", steps: 10000, sleep: 7.5, diet: "早餐：煎蛋；午餐：米饭+蔬菜；晚餐：汤" },
  { day: "Fri", steps: 9400, sleep: 6, diet: "早餐：豆浆+包子；午餐：面条；晚餐：炒菜" },
  { day: "Sat", steps: 12000, sleep: 8, diet: "早餐：燕麦+水果；午餐：炒饭；晚餐：鸡胸肉" },
  { day: "Sun", steps: 8800, sleep: 7, diet: "早餐：牛奶+三明治；午餐：面条；晚餐：沙拉" },
];

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: JSX.Element;
  label: string;
  value: string | number;
  color: string;
}) => (
  <div className="bg-white p-4 rounded-2xl shadow text-center">
    {React.cloneElement(icon, { className: `mx-auto ${color}`, size: 32 })}
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

export default function HealthMate() {
  const [healthData, setHealthData] = useState<HealthDay[]>(defaultHealthData);

  const [stepsInput, setStepsInput] = useState("");
  const [sleepInput, setSleepInput] = useState("");
  const [dietInput, setDietInput] = useState("");

  const [aiAdvice, setAiAdvice] = useState("");
  const [loadingAdvice, setLoadingAdvice] = useState(true);

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayData = healthData[todayIndex];

  const handleAddTodayData = () => {
    const steps = parseInt(stepsInput) || todayData.steps;
    const sleep = parseFloat(sleepInput) || todayData.sleep;
    const diet = dietInput || todayData.diet;
    const newData = [...healthData];
    newData[todayIndex] = { ...newData[todayIndex], steps, sleep, diet };
    setHealthData(newData);
    setStepsInput("");
    setSleepInput("");
    setDietInput("");
  };

  const generateAIAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const recentThree = healthData.slice(-3);
      const summary = recentThree
        .map(
          (d) => `${d.day}: 步数 ${d.steps}, 睡眠 ${d.sleep}小时, 饮食: ${d.diet}`
        )
        .join("； ");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `基于最近三天的健康数据（${summary}），请给出运动、饮食和作息的健康建议，语气温和友善。`,
        }),
      });
      const data = await res.json();
      setAiAdvice(data.reply || "AI 暂时没有回复。");
    } catch {
      setAiAdvice("❌ 网络错误或AI服务调用失败。");
    } finally {
      setLoadingAdvice(false);
    }
  };

  useEffect(() => {
    generateAIAdvice();
  }, [healthData]);

  const sendMessage = async () => {
    if (!chatInput.trim() || sending) return;
    const input = chatInput;
    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      const aiMsg: Message = { role: "ai", text: data.reply || "AI 暂时没有回复。" };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "❌ 网络错误或API调用失败。" },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 text-gray-800">
      <h1 className="text-3xl font-bold text-center mb-6">
        🩺 HealthMate · AI 健康管家
      </h1>

      {/* 今日健康概览 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={<Footprints />} label="步数" value={todayData.steps.toLocaleString()} color="text-blue-500" />
        <StatCard icon={<Moon />} label="睡眠" value={`${todayData.sleep} 小时`} color="text-indigo-500" />
        <StatCard icon={<Heart />} label="心率" value="76 bpm" color="text-red-500" />
        <StatCard icon={<Utensils />} label="饮食" value={todayData.diet} color="text-green-500" />
      </section>

      {/* 添加/修改今日数据 */}
      <section className="bg-white p-6 rounded-2xl shadow mb-10">
        <h2 className="text-lg font-semibold mb-3">✏️ 添加/修改今日数据</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="number" placeholder="步数" className="border rounded-lg p-2" value={stepsInput} onChange={(e) => setStepsInput(e.target.value)} />
          <input type="number" step="0.1" placeholder="睡眠小时" className="border rounded-lg p-2" value={sleepInput} onChange={(e) => setSleepInput(e.target.value)} />
          <input type="text" placeholder="饮食" className="border rounded-lg p-2" value={dietInput} onChange={(e) => setDietInput(e.target.value)} />
        </div>
        <button onClick={handleAddTodayData} className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">保存今日数据</button>
      </section>

      {/* 健康趋势图 */}
      <section className="bg-white p-6 rounded-2xl shadow mb-10">
        <h2 className="text-lg font-semibold mb-3">📈 最近7天健康趋势</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={healthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value, name) => (name === "步数" ? value.toLocaleString() : value)} />
            <Line type="monotone" dataKey="steps" stroke="#3b82f6" name="步数" />
            <Line type="monotone" dataKey="sleep" stroke="#10b981" name="睡眠（小时）" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* 历史健康数据 */}
      <section className="bg-white p-6 rounded-2xl shadow mb-10">
        <h2 className="text-lg font-semibold mb-3">📅 历史健康数据</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">日期</th>
                <th className="border px-4 py-2">步数</th>
                <th className="border px-4 py-2">睡眠(小时)</th>
                <th className="border px-4 py-2">饮食</th>
              </tr>
            </thead>
            <tbody>
              {healthData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{d.day}</td>
                  <td className="border px-4 py-2">{d.steps.toLocaleString()}</td>
                  <td className="border px-4 py-2">{d.sleep}</td>
                  <td className="border px-4 py-2">{d.diet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI 健康建议 */}
      <section className="bg-white p-6 rounded-2xl shadow mb-10">
        <h2 className="text-lg font-semibold mb-3">🤖 AI 健康建议</h2>
        {loadingAdvice ? (
          <p className="text-gray-500">正在生成建议...</p>
        ) : (
          <p className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">{aiAdvice}</p>
        )}
        <button onClick={generateAIAdvice} className="mt-2 text-sm text-blue-500 hover:underline">刷新建议</button>
      </section>

      {/* AI 聊天助手 */}
      <section className="bg-white p-6 rounded-2xl shadow mb-10">
        <h2 className="text-lg font-semibold mb-3">💬 AI 健康对话助手</h2>
        <div ref={chatContainerRef} className="h-64 overflow-y-auto border rounded-lg p-3 mb-3 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">👋 你好，我是你的AI健康助手，有什么想咨询的吗？</p>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`my-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="输入你的问题..."
            className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            className={`bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 ${sending ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={sending}
          >
            <SendHorizontal size={20} />
          </button>
        </div>
      </section>

      <section className="text-center text-gray-600">
        <Brain className="mx-auto mb-2" size={32} />
        <p>保持平衡生活，每天进步一点点 💪</p>
      </section>
    </main>
  );
}
