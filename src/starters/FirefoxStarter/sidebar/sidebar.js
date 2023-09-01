let myWindowId;
const text = window.document.querySelector(".text")
const appPageBtn = window.document.querySelector('.app-page')
const newTabBtn = window.document.querySelector('.new-tab')

let incr = 0

function debug(txt) {
  text.innerText = txt
}

appPageBtn.addEventListener('click', () => {
  let creating = browser.tabs.create({
    active: true,
    url: "/app-page/app-page.html",
  })

})

newTabBtn.addEventListener('click', () => {
  // incr++
  // debug(incr)

  let creating = browser.tabs.create({
    active: true,
    url: "about:blank",
  })

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



/////////////////////

//
// // browser.windows.getCurrent({ populate: true }).then((windowInfo) => {
// //   console.log(111, windowInfo)
// //   //myWindowId = windowInfo.id;
// // });
//
//
// let myWindowId;
// const contentBox = document.querySelector("#content");
//
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
//
// /*
// When the sidebar loads, get the ID of its window,
// and update its content.
// */
// browser.windows.getCurrent({populate: true}).then((windowInfo) => {
//   myWindowId = windowInfo.id;
//   updateContent();
// });
