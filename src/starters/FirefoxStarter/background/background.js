// open sidebar on plugin button click
browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();

  // browser.runtime.sendMessage({
  //   to: 'sidebar',
  //   greeting: "Greeting from the content script",
  // })

  // browser.notifications.create({
  //   type: "basic",
  //   iconUrl: browser.extension.getURL("icons/squidlet-icon-48.png"),
  //   title: 'test title',
  //   message: 'content',
  // });

})


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.to !== 'background') return

})
