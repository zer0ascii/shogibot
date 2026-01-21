const pieces = {
  FU: "歩",
  KY: "香",
  KE: "桂",
  GI: "銀",
  KI: "金",
  KA: "角",
  HI: "飛",
  OU: "王",
  TO: "と",
  NY: "杏",
  NK: "圭",
  NG: "全",
  UM: "馬",
  RY: "龍"
};
const board = document.getElementById("board");

for (let i = 0; i < 81; i++) {
  const square = document.createElement("div");
  square.className = "square";
  square.dataset.index = i;
  board.appendChild(square);
}
