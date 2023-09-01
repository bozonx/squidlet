// /*
// Учитывая имя зверя, получаем URL соответствующего изображения.
// */
// function beastNameToURL(beastName) {
//   switch (beastName) {
//     case "Frog":
//       return browser.extension.getURL("beasts/frog.jpg");
//     case "Snake":
//       return browser.extension.getURL("beasts/snake.jpg");
//     case "Turtle":
//       return browser.extension.getURL("beasts/turtle.jpg");
//   }
// }
//
// /*
// Слушаем события клика во всплывающей панели.
//
// Если кликнули одного из зверей:
//   Добавляем "beastify.js" к активной вкладке.
//
//   Затем получаем активную вкладку и отправляем сценарию "beastify.js"
//   сообщение, содержащее URL к картинке с выбранным зверем.
//
// Если кликнули кнопку, класс которой содержит "clear":
//   Перезагрузить страницу.
//   Закрыть всплывающую панель. Это необходимо, так как content script
//   неисправен после перезагрузки страницы.
// */
//
// document.addEventListener("click", (e) => {
//   if (e.target.classList.contains("beast")) {
//     var chosenBeast = e.target.textContent;
//     var chosenBeastURL = beastNameToURL(chosenBeast);
//
//     browser.tabs.executeScript(null, {
//       file: "/content_scripts/beastify.js",
//     });
//
//     var gettingActiveTab = browser.tabs.query({
//       active: true,
//       currentWindow: true,
//     });
//     gettingActiveTab.then((tabs) => {
//       browser.tabs.sendMessage(tabs[0].id, { beastURL: chosenBeastURL });
//     });
//   } else if (e.target.classList.contains("clear")) {
//     browser.tabs.reload();
//     window.close();
//   }
// });
