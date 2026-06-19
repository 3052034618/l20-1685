export default defineAppConfig({
  pages: [
    'pages/follow/index',
    'pages/tasks/index',
    'pages/reader/index',
    'pages/booklist/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#7B5FFD',
    navigationBarTitleText: '追更阅读器',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8F7FF'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#7B5FFD',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/follow/index',
        text: '今日追更'
      },
      {
        pagePath: 'pages/tasks/index',
        text: '任务书币'
      },
      {
        pagePath: 'pages/reader/index',
        text: '章节阅读'
      }
    ]
  }
})
