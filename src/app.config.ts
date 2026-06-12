export default defineAppConfig({
  pages: [
    'pages/workspace/index',
    'pages/editor/index',
    'pages/results/index',
    'pages/versions/index',
    'pages/library/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6c5ce7',
    navigationBarTitleText: '提示词实验室',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#8e8ea0',
    selectedColor: '#6c5ce7',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/workspace/index',
        text: '工作台'
      },
      {
        pagePath: 'pages/editor/index',
        text: '编辑器'
      },
      {
        pagePath: 'pages/results/index',
        text: '试跑结果'
      },
      {
        pagePath: 'pages/versions/index',
        text: '版本记录'
      },
      {
        pagePath: 'pages/library/index',
        text: '素材库'
      }
    ]
  }
})
