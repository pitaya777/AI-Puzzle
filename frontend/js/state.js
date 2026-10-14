export const state = {
  page: "home",
  creations: [],
  jobs: [],
  active: null,
  job: null,
  config: {},
  selected: null,
  question: -1,
  stats: null,
  admin: false,
  share: null,
  pieceOrders: {},
  uploadFile: null,
  previewUrl: null,
  cropFocusX: 0.5,
  cropFocusY: 0.5,
};

export const questions = [
  "看到这张照片，你最先想到的校园地点是哪里？这里有什么故事？",
  "在校园里，你最想感谢谁？为什么？",
  "哪个瞬间让你觉得自己真正成长？",
  "如果回到初到校园的那一天，你想告诉自己什么？",
];

export const memoryLabels = [
  "关于这个地方",
  "关于那些相遇",
  "关于我的成长",
  "写给那时的自己",
];
