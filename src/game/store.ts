import { create } from "zustand";
import type { GamePhase, GameSave, RoundState } from "./types";
import { createNewSave, loadSave, saveGame, clearSave } from "./persistence";
import { generateRoundQuestions } from "../questions/registry";
import { calculatePoints } from "../quiz/scoring";
import { validateAnswer } from "../questions/registry";
import { buyCar, applyUpgrade } from "../garage/shop";
import { computeEffectiveStats } from "../garage/stats";
import { getLevel, getTrack } from "../config/loadConfig";
import { simulateRace } from "../race/simulation";
import type { Question } from "../questions/types";

interface GameStore extends GameSave {
  questions: Question[];
  raceKeyframes: import("../race/types").RaceKeyframe[] | null;
  init: () => void;
  newGame: (name?: string) => void;
  setPhase: (phase: GamePhase) => void;
  startQuiz: () => void;
  submitAnswer: (input: string, timeRemainingMs: number) => void;
  finishShop: () => void;
  buyCarAction: (carId: string) => boolean;
  buyUpgradeAction: (instanceId: string, upgradeId: string) => boolean;
  selectCar: (instanceId: string) => void;
  runRace: () => void;
  finishRace: () => void;
  continueAfterResult: () => void;
  persist: () => void;
}

function newRoundState(seed: number): RoundState {
  return {
    questionIndex: 0,
    seed,
    creditsThisRound: 0,
    answers: [],
    currentQuestions: [],
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createNewSave(),
  questions: [],
  raceKeyframes: null,

  init() {
    const saved = loadSave();
    if (saved) {
      const questions =
        saved.roundState && saved.phase === "quiz"
          ? generateRoundQuestions(saved.level, saved.roundState.seed)
          : [];
      set({ ...saved, questions, raceKeyframes: null });
    }
  },

  newGame(name) {
    clearSave();
    const save = createNewSave(name);
    set({ ...save, questions: [], raceKeyframes: null });
    saveGame({ ...save, questions: undefined } as unknown as GameSave);
  },

  setPhase(phase) {
    set({ phase });
    get().persist();
  },

  startQuiz() {
    const { level } = get();
    const seed = Math.floor(Math.random() * 1_000_000);
    const questions = generateRoundQuestions(level, seed);
    set({
      phase: "quiz",
      roundState: newRoundState(seed),
      questions,
      lastRaceResult: undefined,
    });
    get().persist();
  },

  submitAnswer(input, timeRemainingMs) {
    const state = get();
    const round = state.roundState;
    if (!round) return;
    const question = state.questions[round.questionIndex];
    if (!question) return;

    const correct = validateAnswer(question, input);
    const points = calculatePoints(correct, timeRemainingMs, question.timeMs);
    const answers = [
      ...round.answers,
      {
        questionId: question.id,
        correct,
        points,
        timeMs: question.timeMs,
        timeRemainingMs,
      },
    ];
    const creditsThisRound = round.creditsThisRound + points;
    const nextIndex = round.questionIndex + 1;

    if (nextIndex >= state.questions.length) {
      set({
        roundState: {
          ...round,
          answers,
          creditsThisRound,
          questionIndex: nextIndex,
        },
        credits: state.credits + creditsThisRound,
        phase: "shop",
        stats: {
          ...state.stats,
          totalCorrect:
            state.stats.totalCorrect + answers.filter((a) => a.correct).length,
        },
      });
    } else {
      set({
        roundState: {
          ...round,
          answers,
          creditsThisRound,
          questionIndex: nextIndex,
        },
      });
    }
    get().persist();
  },

  finishShop() {
    set({ phase: "selectCar" });
    get().persist();
  },

  buyCarAction(carId) {
    const state = get();
    const result = buyCar(carId, state.ownedCars, state.credits);
    if (!result) return false;
    set({ ownedCars: result.cars, credits: result.credits });
    get().persist();
    return true;
  },

  buyUpgradeAction(instanceId, upgradeId) {
    const state = get();
    const car = state.ownedCars.find((c) => c.instanceId === instanceId);
    if (!car) return false;
    const result = applyUpgrade(car, upgradeId, state.credits);
    if (!result) return false;
    set({
      ownedCars: state.ownedCars.map((c) =>
        c.instanceId === instanceId ? result.instance : c,
      ),
      credits: result.credits,
    });
    get().persist();
    return true;
  },

  selectCar(instanceId) {
    set({ selectedCarInstanceId: instanceId, phase: "race" });
    get().persist();
  },

  runRace() {
    const state = get();
    const instance = state.ownedCars.find(
      (c) => c.instanceId === state.selectedCarInstanceId,
    );
    if (!instance) return;

    const level = getLevel(state.level);
    const track = getTrack(level.trackId);
    const stats = computeEffectiveStats(instance);
    const result = simulateRace(stats, track.segments);

    set({
      raceKeyframes: result.keyframes,
      lastRaceResult: {
        success: result.success,
        failureReason: result.failureReason,
        carInstanceId: instance.instanceId,
      },
      stats: {
        ...state.stats,
        totalRaces: state.stats.totalRaces + 1,
        racesWon: state.stats.racesWon + (result.success ? 1 : 0),
      },
    });
    get().persist();
  },

  finishRace() {
    set({ phase: "result" });
    get().persist();
  },

  continueAfterResult() {
    const state = get();
    const won = state.lastRaceResult?.success ?? false;
    if (won && state.level < 9) {
      set({
        level: state.level + 1,
        phase: "quiz",
        roundState: undefined,
        questions: [],
        raceKeyframes: null,
        lastRaceResult: undefined,
        selectedCarInstanceId: undefined,
      });
      get().startQuiz();
    } else {
      set({
        phase: "quiz",
        roundState: undefined,
        questions: [],
        raceKeyframes: null,
        lastRaceResult: undefined,
        selectedCarInstanceId: undefined,
      });
      get().startQuiz();
    }
  },

  persist() {
    const {
      questions,
      raceKeyframes,
      init,
      newGame,
      setPhase,
      startQuiz,
      submitAnswer,
      finishShop,
      buyCarAction,
      buyUpgradeAction,
      selectCar,
      runRace,
      finishRace,
      continueAfterResult,
      persist,
      ...save
    } = get();
    void questions;
    void raceKeyframes;
    void init;
    void newGame;
    void setPhase;
    void startQuiz;
    void submitAnswer;
    void finishShop;
    void buyCarAction;
    void buyUpgradeAction;
    void selectCar;
    void runRace;
    void finishRace;
    void continueAfterResult;
    void persist;
    saveGame(save);
  },
}));
