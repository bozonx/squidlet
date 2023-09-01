// open sidebar on plugin button click
browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();


  // browser.notifications.create({
  //   type: "basic",
  //   iconUrl: browser.extension.getURL("icons/squidlet-icon-48.png"),
  //   title: 'test title',
  //   message: 'content',
  // });

})
