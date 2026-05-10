export interface Chapter {
  id: string;
  number: number;
  title: string;
  date: string;
  pages: number;
  isNew?: boolean;
}

export interface Manhwa {
  id: string;
  title: string;
  cover: string;
  author: string;
  artist: string;
  genre: string[];
  rating: number;
  views: string;
  status: "Ongoing" | "Completed" | "Hiatus";
  description: string;
  chapters: Chapter[];
  tags: string[];
  year: number;
}

const generateChapters = (count: number): Chapter[] => {
  const chapters: Chapter[] = [];
  for (let i = count; i >= 1; i--) {
    const daysAgo = (count - i) * 7;
    const date = new Date(Date.now() - daysAgo * 86400000);
    chapters.push({
      id: `ch_${i}`,
      number: i,
      title: i === count ? `Ch.${i} - The Beginning` : `Chapter ${i}`,
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      pages: Math.floor(Math.random() * 20) + 25,
      isNew: i >= count - 2,
    });
  }
  return chapters;
};

export const MANHWA_LIST: Manhwa[] = [
  {
    id: "solo_leveling",
    title: "Solo Leveling",
    cover: "",
    author: "Chugong",
    artist: "DUBU",
    genre: ["Action", "Adventure", "Fantasy"],
    rating: 9.8,
    views: "125M",
    status: "Completed",
    description:
      "In a world where hunters — humans who possess magical abilities — must battle deadly monsters to protect the human race from certain annihilation, Sung Jinwoo, a rank-E hunter, is the weakest of them all. Known as the 'World's Weakest,' he is barely able to make a living and constantly puts himself in danger. Then, one fateful day, he barely survives a double dungeon that was supposed to be a C-rank run. There, facing certain death, he discovers a mysterious program only he can see: a quest log that the Almighty himself might have created.",
    chapters: generateChapters(179),
    tags: ["System", "Overpowered MC", "Gates", "Necromancy"],
    year: 2018,
  },
  {
    id: "tower_of_god",
    title: "Tower of God",
    cover: "",
    author: "SIU",
    artist: "SIU",
    genre: ["Action", "Mystery", "Fantasy"],
    rating: 9.2,
    views: "98M",
    status: "Ongoing",
    description:
      "What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all? Whatever you desire — it's here. Twenty-Fifth Bam has spent most of his life trapped beneath a vast and dark tower, with only his friend Rachel as his source of light. But when Rachel claims she wants to climb the Tower, and disappears shortly after, Bam is left with only his resolve to find her.",
    chapters: generateChapters(600),
    tags: ["Mystery", "Politics", "Friendship", "Revenge"],
    year: 2010,
  },
  {
    id: "omniscient_reader",
    title: "Omniscient Reader's Viewpoint",
    cover: "",
    author: "Sing Shong",
    artist: "Sleepy-C",
    genre: ["Action", "Drama", "Fantasy"],
    rating: 9.5,
    views: "87M",
    status: "Completed",
    description:
      "Dokja Kim was an average office worker whose sole escape from reality was reading his favorite web novel, 'Three Ways to Survive in a Ruined World'. Then, one day, the world of the novel becomes reality, and he is the only one who knows how the story ends. His knowledge of the plot is his greatest weapon as he battles to survive in a world turned into a catastrophic game.",
    chapters: generateChapters(551),
    tags: ["Apocalypse", "System", "Strategy", "Meta"],
    year: 2020,
  },
  {
    id: "the_beginning_after_the_end",
    title: "The Beginning After the End",
    cover: "",
    author: "TurtleMe",
    artist: "Fuyuki23",
    genre: ["Action", "Adventure", "Fantasy"],
    rating: 9.3,
    views: "76M",
    status: "Ongoing",
    description:
      "King Grey has unparalleled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power. Reborn into a new world filled with magic and monsters, the king has a second chance to relive his life.",
    chapters: generateChapters(195),
    tags: ["Reincarnation", "Magic", "Royalty", "School"],
    year: 2018,
  },
  {
    id: "nano_machine",
    title: "Nano Machine",
    cover: "",
    author: "Geum Gangbulgoe",
    artist: "Han Joong-Wol",
    genre: ["Action", "Martial Arts", "Sci-Fi"],
    rating: 9.0,
    views: "65M",
    status: "Ongoing",
    description:
      "Cheon Yeo-Woon was an orphan who had no hope of survival in the demonic cult. One day, a descendant from the future came and injected nanomachines into him. With the help of the nanomachine, Cheon Yeo-Woon begins his journey to the pinnacle of the murim world.",
    chapters: generateChapters(210),
    tags: ["Nanotechnology", "Cultivation", "Martial Arts"],
    year: 2020,
  },
  {
    id: "wind_breaker",
    title: "Wind Breaker",
    cover: "",
    author: "Yongseok Jo",
    artist: "Yongseok Jo",
    genre: ["Action", "Sports", "Drama"],
    rating: 8.9,
    views: "54M",
    status: "Ongoing",
    description:
      "Shim Kangseok is a high school student who doesn't want to stand out from the crowd but is forced by circumstances to use his cycling abilities to fight and protect his town.",
    chapters: generateChapters(430),
    tags: ["Cycling", "Gang", "School", "Sports"],
    year: 2013,
  },
  {
    id: "return_of_the_mount_hua_sect",
    title: "Return of the Mount Hua Sect",
    cover: "",
    author: "Bi Ryu",
    artist: "Pini",
    genre: ["Action", "Martial Arts", "Comedy"],
    rating: 9.1,
    views: "48M",
    status: "Ongoing",
    description:
      "The Plum Blossom Sword Saint reincarnates 100 years later to find that his sect has fallen to ruin. Now, he must rebuild the Mount Hua Sect with his unmatched martial arts skills.",
    chapters: generateChapters(185),
    tags: ["Reincarnation", "Sect", "Cultivation", "Comedy"],
    year: 2021,
  },
  {
    id: "eleceed",
    title: "Eleceed",
    cover: "",
    author: "SON Jeho",
    artist: "Kim Zhena",
    genre: ["Action", "Comedy", "Superpower"],
    rating: 9.0,
    views: "42M",
    status: "Ongoing",
    description:
      "Jiwoo is a kind-hearted young man with a secret ability. Kayden is a secret agent, trapped in the body of a chubby cat. Together they fight in secret, hiding their true capabilities from the world.",
    chapters: generateChapters(295),
    tags: ["Superpower", "School", "Cat", "Action"],
    year: 2019,
  },
];

export const TRENDING = MANHWA_LIST.slice(0, 5);
export const POPULAR = [...MANHWA_LIST].sort((a, b) => b.rating - a.rating);
export const NEW_UPDATES = MANHWA_LIST.filter((m) => m.status === "Ongoing");

export const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Martial Arts",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sports",
];
