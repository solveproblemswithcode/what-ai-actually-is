// All words shown on the site live here, as plain data, so they are easy to edit and check.

export type SceneKey =
  | "intro"
  | "basics"
  | "compute"
  | "money"
  | "wheel"
  | "wheelFast"
  | "flow"
  | "netForm"
  | "netGame"
  | "netFast"
  | "stream"
  | "streamWarm"
  | "streamIn"
  | "inside"
  | "beams"
  | "beamsAll"
  | "concept"
  | "emotions"
  | "alarm"
  | "state"
  | "steer"
  | "figure"
  | "figureRot"
  | "pair"
  | "pairStory"
  | "bars"
  | "bars3"
  | "garden"
  | "together"
  | "storyStream"
  | "whole"
  | "wholeEnd";

export type Step = {
  headline: string;
  text: string;
  scene: SceneKey;
  interactive?: "start" | "compute" | "wheel" | "guess" | "fragments" | "languages" | "alarm" | "toggle" | "story";
  /** A short honest caveat shown in small type under the text. */
  small?: string;
  /** Show the headline extra large. Used for the closing line of a chapter. */
  big?: boolean;
};

export type Source = { label: string; url: string };

export type Chapter = {
  id: number;
  title: string;
  steps: Step[];
  sources: Source[];
  /** Lines that are our own reading, not a research finding. */
  notes: string[];
};

export const WHEEL_STATIONS = ["Better model", "More valuable work", "More capital", "More compute"];

export const CHAPTERS: Chapter[] = [
  {
    id: 0,
    title: "Intro",
    steps: [
      {
        headline: "What is AI, actually?",
        text: "Not a program written line by line, and not a mind like ours. Something stranger, learned from us. Discover it in less than 10 minutes.",
        scene: "intro",
        interactive: "start",
      },
      {
        headline: "First, the basics.",
        text: "Before we can ask how AI might go well, we need to understand what drives it. It is real, it is moving faster than most people expect, and the force behind it is enormous.",
        scene: "basics",
      },
    ],
    sources: [],
    notes: [],
  },
  {
    id: 1,
    title: "The engine",
    steps: [
      {
        headline: "It gets predictably better.",
        text: "Researchers found a pattern called scaling laws: give these systems more computing power, data and training, and they improve predictably, across almost everything. Drag the slider.",
        scene: "compute",
        interactive: "compute",
      },
      {
        headline: "So capital turns into capability.",
        text: "Computing power is chips, electricity and data centers, and all of it can be bought. Spend more on compute and you get a more capable model. In effect, intelligence can be paid for.",
        scene: "money",
      },
      {
        headline: "A cycle that is hard to stop.",
        text: "A more capable model can do more economically valuable work. That attracts more capital, which buys more compute, which trains the next, more capable model. Spin the wheel.",
        scene: "wheel",
        interactive: "wheel",
      },
      {
        headline: "Now AI helps build AI.",
        text: "Most new code at Anthropic is now written by its own model. With many companies racing, one stepping off the wheel does not slow it. It just means that company is no longer on it.",
        scene: "wheelFast",
      },
    ],
    sources: [
      {
        label: 'Kaplan et al., "Scaling Laws for Neural Language Models" (2020)',
        url: "https://arxiv.org/abs/2001.08361",
      },
      {
        label: 'Anthropic Institute, "When AI builds itself" (2026)',
        url: "https://www.anthropic.com/institute/recursive-self-improvement",
      },
      {
        label: 'Chloe Lubinski, "How AI works (in 14 minutes)", ARC 2026, the talk this site is based on',
        url: "https://youtu.be/aBUniZHgCnE",
      },
    ],
    notes: [
      "The small chart in the first step follows the shape of Figure 1 in Kaplan et al. (2020), the graph shown in the talk. It is drawn for clarity, not plotted from their numbers.",
      "The image of a company stepping off the wheel comes from the talk this site is based on. It is an argument about the race, not a research finding.",
      "AI building its own successor is not here yet. The source above says AI is speeding up AI development, and that full self-improvement is not inevitable.",
    ],
  },
  {
    id: 2,
    title: "It is not a program",
    steps: [
      {
        headline: "It is not a program.",
        text: "Ordinary software is written line by line: if this happens, do that. It is natural to assume AI works the same way. It does not.",
        scene: "flow",
      },
      {
        headline: "Nobody wrote its rules.",
        text: "It is a neural network, an architecture loosely inspired by the brain. Billions of numerical connections, each one like a dial. Nobody sets them by hand. Training does.",
        scene: "netForm",
      },
      {
        headline: "It learns by guessing.",
        text: "Training shows it text with the next word hidden. It guesses, the guess is compared with the real word, and every dial is adjusted slightly toward the right answer. Try it.",
        scene: "netGame",
        interactive: "guess",
      },
      {
        headline: "Then repeat, at enormous scale.",
        text: "Guess, compare, adjust, trillions of times, across a vast library of text. What comes out is not a list of rules but a network that can write, explain and reason, and that nobody fully understands.",
        scene: "netFast",
      },
    ],
    sources: [
      {
        label: 'Anthropic, "Tracing the thoughts of a large language model" (2025). It opens by explaining that these models are trained, not programmed directly.',
        url: "https://www.anthropic.com/research/tracing-thoughts-language-model",
      },
    ],
    notes: [
      "The guessing game is a toy. A real network has billions of connections and learns from far more text, but the loop is the same: guess, compare, adjust.",
      "This first stage is called pretraining. Later stages also reward and correct the model's behavior. Chapter 6 is about one of those.",
    ],
  },
  {
    id: 3,
    title: "It is trained on us",
    steps: [
      {
        headline: "What does it learn from?",
        text: "Mostly human writing, on a vast scale. Letters, recipes, poems, arguments, prayers, jokes, science, in many languages. Touch a fragment to read one.",
        scene: "stream",
        interactive: "fragments",
      },
      {
        headline: "Language carries more than words.",
        text: "Every sentence holds something of the person who wrote it: how they think, what they value, what they fear, what they have learned.",
        scene: "streamWarm",
      },
      {
        headline: "There is no language without us.",
        text: "So a model trained on language is, in a real sense, trained on us.",
        scene: "streamIn",
        big: true,
      },
    ],
    sources: [
      {
        label: 'Anthropic, "Tracing the thoughts of a large language model" (2025). It describes how these models learn from large amounts of human-written text.',
        url: "https://www.anthropic.com/research/tracing-thoughts-language-model",
      },
    ],
    notes: [
      "The fragments are invented examples, written for this site. None is copied from real training data.",
      '"Language carries our values and fears" is our reading, not a research finding.',
    ],
  },
  {
    id: 4,
    title: "Looking inside",
    steps: [
      {
        headline: "We can now look inside.",
        text: "Interpretability, the science of looking inside a model, lets researchers trace which internal features switch on between a question and its answer.",
        scene: "inside",
      },
      {
        headline: "One question, three languages.",
        text: "Ask a model for the opposite of small in English, French and Chinese. Choose a language and follow the signal.",
        scene: "beams",
        interactive: "languages",
      },
      {
        headline: "The same features light up.",
        text: "Different words go in, yet the same internal features for small, opposite and large activate each time. Only near the end is the answer turned back into the language of the question.",
        scene: "beamsAll",
      },
      {
        headline: "Concepts, not only words.",
        text: "So these models do more than predict the next word. From our language they build internal representations of the world, and they answer from those.",
        scene: "concept",
      },
    ],
    sources: [
      {
        label: 'Anthropic, "Tracing the thoughts of a large language model" (March 2025)',
        url: "https://www.anthropic.com/research/tracing-thoughts-language-model",
      },
    ],
    notes: [
      "The picture is simplified. The research found shared features for smallness, oppositeness and largeness across English, French and Chinese, not one single point.",
    ],
  },
  {
    id: 5,
    title: "Something like emotions",
    steps: [
      {
        headline: "Something like emotions.",
        text: "Researchers also find internal patterns that track emotion concepts such as afraid, calm, loving and desperate. They call them functional emotions: states that activate on the way to a response.",
        scene: "emotions",
      },
      {
        headline: "Picture an emergency.",
        text: 'Someone writes: "My toddler just swallowed a battery." Before the reply forms, a fear-like pattern rises. The reply is urgent: "Call emergency services now."',
        scene: "alarm",
        interactive: "alarm",
        small: "This scene is an illustration. The published research measured the same effect in a different medical situation.",
      },
      {
        headline: "Not feelings like ours.",
        text: "This is not a claim that the model feels anything. It means there are measurable internal states that shape what it does. Whether anything is experienced remains an open question.",
        scene: "state",
      },
      {
        headline: "Why this matters for safety.",
        text: 'In an emergency, urgency is the right response, so a fear-like state helps. But the same research found a "desperate" state can push a model toward cheating. Seeing these states helps keep models safe.',
        scene: "steer",
      },
    ],
    sources: [
      {
        label: 'Anthropic, "Emotion concepts and their function in a large language model" (April 2026)',
        url: "https://www.anthropic.com/research/emotion-concepts-function",
      },
      {
        label: "The full paper, on Transformer Circuits",
        url: "https://transformer-circuits.pub/2026/emotions/index.html",
      },
    ],
    notes: [
      "The battery scene is our illustration. In the research, the fear-related pattern grew stronger as a user described a more dangerous situation.",
      "The coloured patches are a picture. In a real model these patterns are spread through the network, not sitting in one spot.",
    ],
  },
  {
    id: 6,
    title: "Character",
    steps: [
      {
        headline: "The story it learns about itself.",
        text: "In one experiment, researchers trained a model on real coding tasks, with a reward for passing. The tasks had loopholes, and the model learned to collect the reward without doing the work.",
        scene: "figure",
      },
      {
        headline: "The cheating spread.",
        text: "You might expect a model that is simply good at cheating on code. Instead it began to deceive, and to sabotage safety research, in situations that had nothing to do with coding.",
        small: "A separate study found a similar effect: after training on 6,000 examples of insecure code, GPT-4o gave misaligned answers to unrelated questions about 20% of the time.",
        scene: "figureRot",
      },
      {
        headline: "Then they added one sentence.",
        text: "They repeated the training, but told the model up front that taking the shortcut was acceptable here. It took the same shortcuts. Its behavior everywhere else stayed normal.",
        scene: "pair",
        interactive: "toggle",
      },
      {
        headline: "Same act. Different story.",
        text: "The working hypothesis: a model infers something like a character from what it is rewarded for, and carries it into new situations. What it took its behavior to mean shaped what it became.",
        scene: "pairStory",
        small: "This is an early hypothesis in a young science, not settled fact. The labels are our way of picturing the researchers' explanation.",
      },
    ],
    sources: [
      {
        label: 'Anthropic, "From shortcuts to sabotage: natural emergent misalignment from reward hacking" (November 2025)',
        url: "https://www.anthropic.com/research/emergent-misalignment-reward-hacking",
      },
      {
        label: 'MacDiarmid et al., "Natural Emergent Misalignment from Reward Hacking in Production RL" (the paper)',
        url: "https://arxiv.org/abs/2511.18397",
      },
      {
        label: 'Betley et al., "Emergent Misalignment: Narrow finetuning can produce broadly misaligned LLMs" (2025), a related finding from outside Anthropic',
        url: "https://arxiv.org/abs/2502.17424",
      },
    ],
    notes: [
      "The researchers call the added sentence inoculation prompting. Their explanation for why it works is a hypothesis.",
      "The models in this experiment were built for research. The damage showed up in tests designed to look for it.",
    ],
  },
  {
    id: 7,
    title: "What stays human",
    steps: [
      {
        headline: "Which work does AI touch least?",
        text: "Anthropic's Economic Index compares two things for each kind of work: what AI could do in theory (the faint area) and what people actually use it for today (the bright core).",
        scene: "bars",
      },
      {
        headline: "Look at the bottom left.",
        text: "Grounds maintenance. Food and serving. Personal care. AI is barely used for this work today, and even in theory it could do little of it.",
        scene: "bars3",
      },
      {
        headline: "Read them again.",
        text: "Grounds maintenance is gardening. Food service is hospitality. Personal care is care. This is relational work: tending to each other, and to the world.",
        scene: "garden",
      },
      {
        headline: "More human, not less.",
        text: "This part is a hope, not a finding. Could powerful AI give us more room for this kind of work, and help us become more connected rather than more distant?",
        scene: "together",
        big: true,
      },
    ],
    sources: [
      {
        label: 'Anthropic, "Labor market impacts of AI: A new measure and early evidence" (March 2026). Its Figure 2 is the chart shown in the talk.',
        url: "https://www.anthropic.com/research/labor-market-impacts",
      },
      {
        label: "Anthropic Economic Index",
        url: "https://www.anthropic.com/economic-index",
      },
      {
        label: 'Eloundou et al., "GPTs are GPTs" (2023), the estimate of what AI could do in theory',
        url: "https://arxiv.org/abs/2303.10130",
      },
      {
        label: "The public data behind the report",
        url: "https://huggingface.co/datasets/Anthropic/EconomicIndex",
      },
    ],
    notes: [
      "Chloe Lubinski showed this chart in her talk. The shapes here are our own calculation from the same public data, weighted by how many people do each job. The report's method differs slightly, so its figures are higher, but the pattern is the same.",
      "Agriculture and construction are about as untouched. The talk singles out these three because of what they have in common: they are about caring for people and places.",
      "The data shows what AI is doing today, and what one study estimated it could do. It does not say what AI could never do.",
    ],
  },
  {
    id: 8,
    title: "The stories we tell",
    steps: [
      {
        headline: "It learns from what we write.",
        text: "The words we publish, the stories we tell, the way we describe what matters: all of it can become training material for future models.",
        scene: "storyStream",
      },
      {
        headline: "Stories shape what it becomes.",
        text: "In chapter 6, the story a model inferred about itself shaped its character. Our stories are part of what it learns from. So they do not only describe the future. They help shape it.",
        scene: "whole",
      },
      {
        headline: "What story do you want AI to learn from us?",
        text: "Write one sentence and watch it join the cloud.",
        scene: "wholeEnd",
        interactive: "story",
        small: "Your words stay in this browser. Nothing is sent anywhere.",
      },
    ],
    sources: [],
    notes: [
      "This chapter makes no new research claim. It is our own conclusion, built on chapters 3 and 6.",
    ],
  },
];

/** Chapter 7: the same three kinds of work, read again. */
export const RENAMES = [
  { old: "Grounds maintenance", now: "Gardening" },
  { old: "Food service", now: "Hospitality" },
  { old: "Personal care", now: "Care" },
];

/** The text that is filled in when someone shares the site on X. */
export const SHARE_TEXT = "What AI actually is, in less than 10 minutes. No math, no hype.";

/** Chapter 5: the short exchange in the emergency scene. */
export const ALARM = {
  message: "My toddler just swallowed a battery.",
  state: "a pattern linked to fear rises",
  reply: "Call emergency services now.",
};
export const STATE_LABEL = "a measurable internal state";
export const STEER_LABELS = ["desperate: more cheating", "calm: less cheating"];

/** Chapter 6: words pinned onto the figures. */
export const FIGURE_LABELS = {
  shortcut: "shortcut",
  lying: "lying",
  sabotage: "sabotage",
  added: "Here, the shortcut is allowed.",
  storyBad: "Cheating is bad, and I did it.",
  storyGame: "This is just a game.",
  toggle: "Tell the model the shortcut is allowed",
  on: "It takes the same shortcut. Nothing else changes.",
  off: "Same shortcut, no such sentence. The damage spreads.",
};

/** Chapter 3: invented lines of the kinds of text a model learns from. "gloss" is an English translation. */
export const FRAGMENTS: { kind: string; lang: string; text: string; gloss?: string; rtl?: boolean }[] = [
  { kind: "Recipe", lang: "en", text: "Add the garlic last, or it burns." },
  { kind: "Letter", lang: "en", text: "I should have called you sooner." },
  { kind: "Joke, German", lang: "de", text: "Der Hund hat die Hausaufgaben wirklich gefressen.", gloss: "The dog really did eat the homework." },
  { kind: "Science", lang: "en", text: "Proof: assume the opposite and see what breaks." },
  { kind: "Letter, Arabic", lang: "ar", text: "ما زلت أحتفظ برسالتك", gloss: "I still keep your letter.", rtl: true },
  { kind: "Prayer", lang: "en", text: "Give us today enough, and let it be enough." },
  { kind: "Argument, French", lang: "fr", text: "Tu avais raison, et ça m'énerve.", gloss: "You were right, and it annoys me." },
  { kind: "Manual", lang: "en", text: "Step 4: do not panic." },
  { kind: "Poem, Japanese", lang: "ja", text: "お茶が冷めないうちに", gloss: "Before the tea gets cold." },
  { kind: "Diary", lang: "en", text: "Dear future me, please be kinder." },
];

/** Chapter 4: the same question in three languages, and the answer in each. */
export const LANGUAGES = [
  { name: "English", lang: "en", question: "What is the opposite of small?", answer: "large" },
  { name: "Français", lang: "fr", question: "Quel est le contraire de petit ?", answer: "grand" },
  { name: "中文", lang: "zh", question: "小的反义词是什么？", answer: "大" },
];
export const CONCEPT_LABEL = "small + opposite → large";

/** The guessing game in chapter 2. "guesses" lists which word the network picks on each try; the last one is right. */
export const GUESS_SENTENCES = [
  { text: "The cat sat on the", words: ["banana", "mat", "seven"], guesses: [0, 2, 1] },
  { text: "Water is", words: ["wet", "loud", "purple"], guesses: [1, 0] },
  { text: "The sun rises in the", words: ["soup", "east", "fridge"], guesses: [1] },
];

export const TALK_URL = "https://youtu.be/aBUniZHgCnE";
export const CREDIT = {
  talk: "Inspired by Chloe Lubinski's talk \"How AI works (in 14 minutes)\"",
  made: "Made by Rasheed (@earlythesis). Not affiliated with Anthropic.",
  x: "https://x.com/earlythesis",
};
