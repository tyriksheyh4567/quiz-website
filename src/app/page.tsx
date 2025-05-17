"use client"

import React, { useState, useEffect, useRef } from "react";

const blueColors = {
  light: "bg-blue-100",
  medium: "bg-blue-400",
  dark: "bg-blue-700",
  textLight: "text-blue-100",
  textMedium: "text-blue-600",
  textDark: "text-blue-900",
};

const russianTexts = {
  welcomeTitle: "Генератор викторин с помощью ИИ",
  welcomeDescription:
    "Добро пожаловать! Этот веб-сайт позволяет создавать викторины с помощью искусственного интеллекта. " +
    "Аудитория: от 7 до 11 класса. Можно проводить соревнования между командами.",
  nextButton: "Далее",
  startButton: "Начать игру",
  backButton: "Назад",
  teamSetupTitle: "Настройка команды",
  teamNameLabel: "Название команды",
  teamMembersLabel: "Участники команды (через запятую)",
  curatorLabel: "Куратор",
  classLabel: "Класс участников",
  topicLabel: "Выбор темы",
  topicOptions: ["Физика", "Информатика"],
  quizTitle: "Викторина",
  questionTimer: "Время на вопрос: ",
  resultsTitle: "Результаты",
  shareText: "Поделиться результатами",
  loadingText: "Загрузка вопросов...",
  errorText: "Произошла ошибка при загрузке вопросов.",
};

type TeamSetup = {
  teamName: string;
  teamMembers: string;
  curator: string;
  classGrade: string;
  topic: string;
};

type Question = {
  question: string;
  options: string[];
  correctAnswer?: string;
  timeLimit: number; // seconds
};

type Round = {
  title: string;
  questions: Question[];
  timePerQuestion: number;
  totalTime?: number; // for long tasks
};

export default function Home() {
  const [step, setStep] = useState<"welcome" | "teamSetup" | "quiz" | "results">(
    "welcome"
  );
  const [teamSetup, setTeamSetup] = useState<TeamSetup>({
    teamName: "",
    teamMembers: "",
    curator: "",
    classGrade: "7",
    topic: russianTexts.topicOptions[0],
  });
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (step !== "quiz") return;

    if (timeLeft === 0) {
      handleNextQuestion();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, step]);

  // Fetch quiz questions from API
  async function fetchQuizRounds() {
    setLoading(true);
    setError(null);

    try {
      // Build prompt based on topic and classGrade
      const { topic, classGrade } = teamSetup;

      let prompt = "";

      if (topic === "Физика") {
        prompt = `
Создай викторину по физике для ${classGrade} класса (школьная программа России) на русском языке.
Раунд 1: 3 вопроса про известных физиков/учёных с 3 вариантами ответа, время на вопрос 30 секунд.
Раунд 2: 3 вопроса про формулы и их величины, 3 варианта ответа, время на вопрос 30 секунд.
Раунд 3: 1 задача по физике, время на решение 5 минут.
Формат вывода: JSON массив раундов с вопросами, вариантами ответов и временем на вопрос.
`;
      } else if (topic === "Информатика") {
        prompt = `
Создай викторину по информатике для ${classGrade} класса (школьная программа России) на русском языке.
Раунд 1: 3 вопроса про известные методы в информатике с 3 вариантами ответа, время на вопрос 30 секунд.
Раунд 2: 3 вопроса про различные величины в информатике с 3 вариантами ответа, время на вопрос 30 секунд.
Раунд 3: 1 задача по информатике, время на решение 5 минут.
Формат вывода: JSON массив раундов с вопросами, вариантами ответов и временем на вопрос.
`;
      }

      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, max_tokens: 1500 }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Parse JSON from AI response
      const parsedRounds: Round[] = JSON.parse(data.result);

      setRounds(parsedRounds);
      setCurrentRoundIndex(0);
      setCurrentQuestionIndex(0);
      setAnswers(Array(parsedRounds[0].questions.length).fill(null));
      setStep("quiz");
    } catch (err) {
      setError("Ошибка при загрузке викторины.");
    } finally {
      setLoading(false);
    }
  }

  function handleNextQuestion() {
    const currentRound = rounds[currentRoundIndex];
    if (!currentRound) return;

    if (currentQuestionIndex + 1 < currentRound.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(currentRound.timePerQuestion);
      setAnswers((prev) => {
        const newAnswers = [...prev];
        if (newAnswers[currentQuestionIndex] === null) newAnswers[currentQuestionIndex] = null;
        return newAnswers;
      });
    } else if (currentRoundIndex + 1 < rounds.length) {
      setCurrentRoundIndex(currentRoundIndex + 1);
      setCurrentQuestionIndex(0);
      setTimeLeft(rounds[currentRoundIndex + 1].timePerQuestion);
      setAnswers(Array(rounds[currentRoundIndex + 1].questions.length).fill(null));
    } else {
      setStep("results");
    }
  }

  function handleAnswerSelect(answer: string) {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  }

  function handleStart() {
    fetchQuizRounds();
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setTeamSetup((prev) => ({ ...prev, [name]: value }));
  }

  // Initialize timer when question or round changes
  useEffect(() => {
    if (step !== "quiz") return;
    const currentRound = rounds[currentRoundIndex];
    if (!currentRound) return;

    const time =
      currentRound.questions[currentQuestionIndex]?.timeLimit ||
      currentRound.timePerQuestion ||
      30;
    setTimeLeft(time);
  }, [currentQuestionIndex, currentRoundIndex, rounds, step]);

  // Render functions for each step
  function renderWelcome() {
    return (
      <div className="max-w-3xl text-center text-blue-900">
        <h1 className="text-4xl font-bold mb-6">{russianTexts.welcomeTitle}</h1>
        <p className="mb-4 text-lg">{russianTexts.welcomeDescription}</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => setStep("teamSetup")}
        >
          {russianTexts.nextButton}
        </button>
      </div>
    );
  }

  function renderTeamSetup() {
    return (
      <div className="max-w-xl bg-blue-50 p-6 rounded shadow-md text-blue-900">
        <h2 className="text-2xl font-semibold mb-4">{russianTexts.teamSetupTitle}</h2>
        <label className="block mb-2">
          {russianTexts.teamNameLabel}
          <input
            type="text"
            name="teamName"
            value={teamSetup.teamName}
            onChange={handleInputChange}
            className="w-full mt-1 p-2 border border-blue-300 rounded"
          />
        </label>
        <label className="block mb-2">
          {russianTexts.teamMembersLabel}
          <input
            type="text"
            name="teamMembers"
            value={teamSetup.teamMembers}
            onChange={handleInputChange}
            placeholder="Иванов, Петров, Сидоров"
            className="w-full mt-1 p-2 border border-blue-300 rounded"
          />
        </label>
        <label className="block mb-2">
          {russianTexts.curatorLabel}
          <input
            type="text"
            name="curator"
            value={teamSetup.curator}
            onChange={handleInputChange}
            className="w-full mt-1 p-2 border border-blue-300 rounded"
          />
        </label>
        <label className="block mb-2">
          {russianTexts.classLabel}
          <select
            name="classGrade"
            value={teamSetup.classGrade}
            onChange={handleInputChange}
            className="w-full mt-1 p-2 border border-blue-300 rounded"
          >
            {[7, 8, 9, 10, 11].map((grade) => (
              <option key={grade} value={grade.toString()}>
                {grade} класс
              </option>
            ))}
          </select>
        </label>
        <label className="block mb-4">
          {russianTexts.topicLabel}
          <select
            name="topic"
            value={teamSetup.topic}
            onChange={handleInputChange}
            className="w-full mt-1 p-2 border border-blue-300 rounded"
          >
            {russianTexts.topicOptions.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-between">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => setStep("welcome")}
          >
            {russianTexts.backButton}
          </button>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handleStart}
            disabled={
              !teamSetup.teamName ||
              !teamSetup.teamMembers ||
              !teamSetup.curator ||
              !teamSetup.classGrade
            }
          >
            {russianTexts.startButton}
          </button>
        </div>
      </div>
    );
  }

  function renderQuiz() {
    if (loading) {
      return <p className="text-blue-700">{russianTexts.loadingText}</p>;
    }
    if (error) {
      return <p className="text-red-600">{russianTexts.errorText}</p>;
    }
    if (rounds.length === 0) {
      return null;
    }

    const currentRound = rounds[currentRoundIndex];
    const currentQuestion = currentRound.questions[currentQuestionIndex];

    return (
      <div className="max-w-3xl bg-blue-50 p-6 rounded shadow-md text-blue-900">
        <h2 className="text-2xl font-semibold mb-4">
          {russianTexts.quizTitle} - {currentRound.title}
        </h2>
        <p className="mb-2 font-semibold">{currentQuestion.question}</p>
        <div className="mb-4">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              className={`block w-full text-left p-2 mb-2 border rounded hover:bg-blue-200 transition ${
                answers[currentQuestionIndex] === option
                  ? "bg-blue-400 text-white"
                  : "bg-white"
              }`}
              onClick={() => handleAnswerSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mb-4">
          {russianTexts.questionTimer} {timeLeft} секунд
        </p>
        <div className="flex justify-between">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              } else if (currentRoundIndex > 0) {
                setCurrentRoundIndex(currentRoundIndex - 1);
                setCurrentQuestionIndex(
                  rounds[currentRoundIndex - 1].questions.length - 1
                );
              }
            }}
            disabled={currentRoundIndex === 0 && currentQuestionIndex === 0}
          >
            {russianTexts.backButton}
          </button>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handleNextQuestion}
          >
            {currentRoundIndex === rounds.length - 1 &&
            currentQuestionIndex ===
              rounds[rounds.length - 1].questions.length - 1
              ? russianTexts.nextButton
              : russianTexts.nextButton}
          </button>
        </div>
      </div>
    );
  }

  function renderResults() {
    return (
      <div className="max-w-3xl text-blue-900 text-center">
        <h2 className="text-3xl font-bold mb-6">{russianTexts.resultsTitle}</h2>
        <p>Спасибо за участие! Ваши результаты:</p>
        <ul className="list-disc list-inside text-left max-w-md mx-auto my-4">
          {rounds.map((round, rIdx) => (
            <li key={rIdx}>
              <strong>{round.title}:</strong>{" "}
              {answers
                .slice(
                  rIdx === 0
                    ? 0
                    : rounds
                        .slice(0, rIdx)
                        .reduce((acc, cur) => acc + cur.questions.length, 0),
                  rounds
                    .slice(0, rIdx + 1)
                    .reduce((acc, cur) => acc + cur.questions.length, 0)
                )
                .filter((a) => a !== null).length}{" "}
              из {round.questions.length} правильных ответов
            </li>
          ))}
        </ul>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => setStep("welcome")}
        >
          Начать заново
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-blue-100 to-white flex items-center justify-center p-8">
      {step === "welcome" && renderWelcome()}
      {step === "teamSetup" && renderTeamSetup()}
      {step === "quiz" && renderQuiz()}
      {step === "results" && renderResults()}
    </div>
  );
}
