let myWindowId;
const text = window.document.querySelector(".text")
const appPageBtn = window.document.querySelector('.app-page')
const newTabBtn = window.document.querySelector('.new-tab')

let incr = 0

function debug(txt) {
  text.innerText = txt
}

function debugJson(js) {
  text.innerText = JSON.stringify(js, null, 2)
}

appPageBtn.addEventListener('click', () => {
  let creating = browser.tabs.create({
    active: true,
    url: "/app-page/app-page.html?p=123",
  })

})

newTabBtn.addEventListener('click', () => {
  // incr++
  // debug(incr)

  // browser.runtime.sendMessage({
  //   greeting: "Greeting from the content script",
  // })

  let creating = browser.tabs.create({
    active: true,
    url: "about:blank",
  })

})


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.to !== 'sidebar') return

  debugJson(request)
})

// /*
// Make the content box editable as soon as the user mouses over the sidebar.
// */
// window.addEventListener("mouseover", () => {
//   contentBox.setAttribute("contenteditable", true);
// });
//
// /*
// When the user mouses out, save the current contents of the box.
// */
// window.addEventListener("mouseout", () => {
//   contentBox.setAttribute("contenteditable", false);
//   browser.tabs.query({windowId: myWindowId, active: true}).then((tabs) => {
//     let contentToStore = {};
//     contentToStore[tabs[0].url] = contentBox.textContent;
//     browser.storage.local.set(contentToStore);
//   });
// });
//
// /*
// Update the sidebar's content.
//
// 1) Get the active tab in this sidebar's window.
// 2) Get its stored content.
// 3) Put it in the content box.
// */
// function updateContent() {
//   browser.tabs.query({windowId: myWindowId, active: true})
//     .then((tabs) => {
//       return browser.storage.local.get(tabs[0].url);
//     })
//     .then((storedInfo) => {
//       contentBox.textContent = storedInfo[Object.keys(storedInfo)[0]];
//     });
// }
//
// /*
// Update content when a new tab becomes active.
// */
// browser.tabs.onActivated.addListener(updateContent);
//
// /*
// Update content when a new page is loaded into a tab.
// */
// browser.tabs.onUpdated.addListener(updateContent);

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});

