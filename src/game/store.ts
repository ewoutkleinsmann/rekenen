import { create } from "zustand";
import type { GamePhase, GameSave, RoundState } from "./types";
import { createNewSave, loadSave, saveGame, clearSave } from "./persistence";
import { generateRoundQuestions } from "../questions/registry";
import { calculatePoints } from "../quiz/scoring";
import { validateAnswer } from "../questions/registry";
import { buyCar, applyUpgrade } from "../garage/shop";
import { computeEffectiveStats } from "../garage/stats";
import { getLevel, getTrack, getMaxLevelId } from "../config/loadConfig";
import type { RaceReplay } from "../race3d/sim/types";
import type { Question } from "../questions/types";

interface GameStore extends GameSave {
  questions: Question[];
  raceReplay: RaceReplay | null;
  init: () => void;
  newGame: (name?: string) => void;
  setPhase: (phase: GamePhase) => void;
  startLevel: () => void;
  beginQuiz: () => void;
  submitAnswer: (input: string, timeRemainingMs: number) => void;
  finishShop: () => void;
  buyCarAction: (carId: string) => boolean;
  buyUpgradeAction: (instanceId: string, upgradeId: string) => boolean;
  selectCar: (instanceId: string) => void;
  runRace: () => Promise<void>;
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
  raceReplay: null,

  init() {
    const saved = loadSave();
    if (saved) {
      const needsQuestions =
        saved.roundState &&
        (saved.phase === "quiz" || saved.phase === "intro");
      const questions = needsQuestions
        ? generateRoundQuestions(saved.level, saved.roundState!.seed)
        : [];
      set({ ...saved, questions, raceReplay: null });
    }
  },

  newGame(name) {
    clearSave();
    const save = createNewSave(name);
    set({ ...save, questions: [], raceReplay: null });
    saveGame({ ...save, questions: undefined } as unknown as GameSave);
  },

  setPhase(phase) {
    set({ phase });
    get().persist();
  },

  startLevel() {
    const { level } = get();
    const seed = Math.floor(Math.random() * 1_000_000);
    const questions = generateRoundQuestions(level, seed);
    set({
      phase: "intro",
      roundState: newRoundState(seed),
      questions,
      lastRaceResult: undefined,
    });
    get().persist();
  },

  beginQuiz() {
    set({ phase: "quiz" });
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
    const result = buyCar(carId, state.ownedCars, state.credits, state.level);
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

  async runRace() {
    const state = get();
    const instance = state.ownedCars.find(
      (c) => c.instanceId === state.selectedCarInstanceId,
    );
    if (!instance) return;

    const level = getLevel(state.level);
    const track = getTrack(level.trackId);
    const stats = computeEffectiveStats(instance);
    const { simulateRace3D } = await import("../race3d/sim/simulateRace3d");
    const result = await simulateRace3D(stats, track);

    set({
      raceReplay: result,
      lastRaceResult: {
        success: result.success,
        failureReason: result.failureReason,
        carInstanceId: instance.instanceId,
      },
      stats: {
        ...get().stats,
        totalRaces: get().stats.totalRaces + 1,
        racesWon: get().stats.racesWon + (result.success ? 1 : 0),
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
    set({
      level:
        won && state.level < getMaxLevelId()
          ? state.level + 1
          : state.level,
      roundState: undefined,
      questions: [],
      raceReplay: null,
      lastRaceResult: undefined,
      selectedCarInstanceId: undefined,
    });
    get().startLevel();
  },

  persist() {
    const {
      questions,
      raceReplay,
      init,
      newGame,
      setPhase,
      startLevel,
      beginQuiz,
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
    void raceReplay;
    void init;
    void newGame;
    void setPhase;
    void startLevel;
    void beginQuiz;
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
