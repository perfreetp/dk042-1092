import type { Experiment, Fragment } from '@/types';

export const mockExperiments: Experiment[] = [
  {
    id: 'exp001',
    name: '客服话术生成',
    description: '根据客户问题自动生成专业客服回复话术',
    promptContent: '你是一位专业的客服人员，请根据以下客户问题生成礼貌、专业的回复。\n\n客户问题：{{customer_question}}\n产品类型：{{product_type}}\n情绪状态：{{emotion}}\n\n请生成回复，要求：1. 语气亲切 2. 解决问题 3. 不超过200字',
    variables: [
      { name: 'customer_question', defaultValue: '' },
      { name: 'product_type', defaultValue: '电子产品' },
      { name: 'emotion', defaultValue: '平和' },
    ],
    sampleInputs: [
      { id: 's001', name: '退款咨询', values: { customer_question: '我买的商品想退款，怎么操作？', product_type: '电子产品', emotion: '平和' } },
      { id: 's002', name: '物流投诉', values: { customer_question: '快递已经5天了还没到，太慢了！', product_type: '日用百货', emotion: '不满' } },
      { id: 's003', name: '产品咨询', values: { customer_question: '这款耳机支持降噪吗？', product_type: '电子产品', emotion: '好奇' } },
    ],
    results: [
      { id: 'r001', sampleInputId: 's001', sampleName: '退款咨询', output: '您好！感谢您的咨询。关于退款操作，您可以进入"我的订单"→找到对应订单→点击"申请退款"即可。一般1-3个工作日到账。如有疑问随时联系我们哦~', rating: 4, createdAt: '2026-06-10T10:30:00Z', versionId: 'v002', versionNumber: 2 },
      { id: 'r002', sampleInputId: 's002', sampleName: '物流投诉', output: '非常抱歉给您带来不便！我理解您的焦急心情。已帮您查询物流信息，包裹正在派送中，预计今天下午送达。为弥补您的等待，我们送您一张10元优惠券，已发至账户~', rating: 5, createdAt: '2026-06-10T10:31:00Z', versionId: 'v002', versionNumber: 2 },
      { id: 'r003', sampleInputId: 's003', sampleName: '产品咨询', output: '您好！这款耳机确实支持主动降噪功能，降噪深度可达35dB，通勤和办公使用都非常适合。还有任何问题欢迎继续咨询~', rating: 4, createdAt: '2026-06-10T10:32:00Z', versionId: 'v002', versionNumber: 2 },
      { id: 'r010', sampleInputId: 's001', sampleName: '退款咨询', output: '你好，退款请找客服。', rating: 2, createdAt: '2026-06-08T14:00:00Z', versionId: 'v001', versionNumber: 1 },
      { id: 'r011', sampleInputId: 's002', sampleName: '物流投诉', output: '物流慢请耐心等待。', rating: 3, createdAt: '2026-06-08T14:01:00Z', versionId: 'v001', versionNumber: 1 },
      { id: 'r012', sampleInputId: 's003', sampleName: '产品咨询', output: '支持降噪。', rating: 2, createdAt: '2026-06-08T14:02:00Z', versionId: 'v001', versionNumber: 1 },
    ],
    versions: [
      { id: 'v001', experimentId: 'exp001', content: '你是一位客服，请回复客户问题。\n客户问题：{{customer_question}}', variables: [{ name: 'customer_question', defaultValue: '' }], createdAt: '2026-06-08T14:00:00Z', avgRating: 2.5, runCount: 3, note: '初版', versionNumber: 1 },
      { id: 'v002', experimentId: 'exp001', content: '你是一位专业的客服人员，请根据客户问题生成礼貌、专业的回复。\n\n客户问题：{{customer_question}}\n产品类型：{{product_type}}\n情绪状态：{{emotion}}\n\n请生成回复，要求：1. 语气亲切 2. 解决问题 3. 不超过200字', variables: [{ name: 'customer_question', defaultValue: '' }, { name: 'product_type', defaultValue: '电子产品' }, { name: 'emotion', defaultValue: '平和' }], createdAt: '2026-06-10T10:00:00Z', avgRating: 4.3, runCount: 3, note: '增加产品和情绪变量', versionNumber: 2 },
    ],
    comments: [
      { id: 'c001', author: '张三', avatar: 'https://picsum.photos/id/64/200/200', content: 'v2 版本效果提升明显，情绪变量很有用', createdAt: '2026-06-10T11:00:00Z', targetType: 'version', targetId: 'v002', versionNumber: 2 },
      { id: 'c002', author: '李四', avatar: 'https://picsum.photos/id/91/200/200', content: '建议增加回复长度控制变量', createdAt: '2026-06-10T11:30:00Z', targetType: 'experiment', targetId: 'exp001' },
    ],
    status: 'testing',
    tags: ['客服', '话术', '自动化'],
    createdAt: '2026-06-08T14:00:00Z',
    updatedAt: '2026-06-10T11:30:00Z',
  },
  {
    id: 'exp002',
    name: '产品描述生成',
    description: '自动生成电商产品详情页描述文案',
    promptContent: '你是一位资深电商文案，请为以下产品生成吸引人的详情描述。\n\n产品名称：{{product_name}}\n核心卖点：{{key_features}}\n目标人群：{{target_audience}}\n\n要求：1. 突出核心卖点 2. 语气有感染力 3. 300字以内',
    variables: [
      { name: 'product_name', defaultValue: '' },
      { name: 'key_features', defaultValue: '' },
      { name: 'target_audience', defaultValue: '年轻白领' },
    ],
    sampleInputs: [
      { id: 's004', name: '蓝牙耳机', values: { product_name: 'AirPods Pro 3', key_features: '主动降噪、空间音频、长续航', target_audience: '音乐爱好者' } },
      { id: 's005', name: '护肤精华', values: { product_name: '焕采精华液', key_features: '烟酰胺+透明质酸、美白保湿', target_audience: '25-35岁女性' } },
    ],
    results: [
      { id: 'r004', sampleInputId: 's004', sampleName: '蓝牙耳机', output: '🎵 AirPods Pro 3，让音乐环绕你！搭载最新主动降噪技术，35dB深度降噪，通勤路上秒变私人音乐厅。空间音频带来沉浸式体验，仿佛置身演唱会现场！超长续航，一整天都不掉线。', rating: 5, createdAt: '2026-06-09T15:30:00Z', versionId: 'v003', versionNumber: 1 },
      { id: 'r005', sampleInputId: 's005', sampleName: '护肤精华', output: '焕采精华液，一瓶搞定美白+保湿！双重核心成分：5%烟酰胺精准淡斑，透明质酸深层锁水。轻透质地一抹即吸收，告别黏腻感。28天见证肌肤蜕变！', rating: 4, createdAt: '2026-06-09T15:31:00Z', versionId: 'v003', versionNumber: 1 },
    ],
    versions: [
      { id: 'v003', experimentId: 'exp002', content: '你是一位资深电商文案，请为以下产品生成吸引人的详情描述。\n\n产品名称：{{product_name}}\n核心卖点：{{key_features}}\n目标人群：{{target_audience}}\n\n要求：1. 突出核心卖点 2. 语气有感染力 3. 300字以内', variables: [{ name: 'product_name', defaultValue: '' }, { name: 'key_features', defaultValue: '' }, { name: 'target_audience', defaultValue: '年轻白领' }], createdAt: '2026-06-09T15:00:00Z', avgRating: 4.5, runCount: 2, note: '首版', versionNumber: 1 },
    ],
    comments: [
      { id: 'c003', author: '王五', avatar: 'https://picsum.photos/id/177/200/200', content: '文案很有感染力，emoji 用得好', createdAt: '2026-06-09T16:00:00Z' },
    ],
    status: 'stable',
    tags: ['电商', '文案', '产品描述'],
    createdAt: '2026-06-09T15:00:00Z',
    updatedAt: '2026-06-09T16:00:00Z',
  },
  {
    id: 'exp003',
    name: '社交媒体标题',
    description: '生成吸引眼球的社交媒体帖子标题',
    promptContent: '你是一位社交媒体运营专家，请为以下内容生成3个吸引眼球的标题。\n\n内容主题：{{topic}}\n平台：{{platform}}\n风格：{{style}}\n\n要求：1. 符合平台调性 2. 有吸引力 3. 包含关键词',
    variables: [
      { name: 'topic', defaultValue: '' },
      { name: 'platform', defaultValue: '小红书' },
      { name: 'style', defaultValue: '活泼' },
    ],
    sampleInputs: [
      { id: 's006', name: '美食分享', values: { topic: '周末在家做蛋糕', platform: '小红书', style: '活泼可爱' } },
    ],
    results: [
      { id: 'r006', sampleInputId: 's006', sampleName: '美食分享', output: '1. 🍰周末宅家也能做出神仙蛋糕！新手零失败~\n2. 谁说做蛋糕很难？这个配方闭眼冲！\n3. 姐妹们！这款蛋糕配方我私藏了好久...', rating: 3, createdAt: '2026-06-11T09:00:00Z', versionId: 'v004', versionNumber: 1 },
    ],
    versions: [
      { id: 'v004', experimentId: 'exp003', content: '你是一位社交媒体运营专家，请为以下内容生成3个吸引眼球的标题。\n\n内容主题：{{topic}}\n平台：{{platform}}\n风格：{{style}}\n\n要求：1. 符合平台调性 2. 有吸引力 3. 包含关键词', variables: [{ name: 'topic', defaultValue: '' }, { name: 'platform', defaultValue: '小红书' }, { name: 'style', defaultValue: '活泼' }], createdAt: '2026-06-11T08:00:00Z', avgRating: 3.0, runCount: 1, note: '初版尝试', versionNumber: 1 },
    ],
    comments: [],
    status: 'draft',
    tags: ['社交', '标题', '运营'],
    createdAt: '2026-06-11T08:00:00Z',
    updatedAt: '2026-06-11T09:00:00Z',
  },
  {
    id: 'exp004',
    name: '周报自动生成',
    description: '根据工作内容自动生成周报总结',
    promptContent: '你是一位职场助手，请根据以下工作内容生成一份结构清晰的周报。\n\n本周完成：{{completed}}\n进行中：{{in_progress}}\n下周计划：{{next_plan}}\n\n要求：1. 条理清晰 2. 数据量化 3. 突出成果',
    variables: [
      { name: 'completed', defaultValue: '' },
      { name: 'in_progress', defaultValue: '' },
      { name: 'next_plan', defaultValue: '' },
    ],
    sampleInputs: [
      { id: 's007', name: '产品经理周报', values: { completed: '完成V2.0需求评审，上线3个功能', in_progress: 'V2.1需求分析', next_plan: 'V2.1设计评审' } },
    ],
    results: [],
    versions: [],
    comments: [],
    status: 'draft',
    tags: ['办公', '周报', '自动化'],
    createdAt: '2026-06-12T08:00:00Z',
    updatedAt: '2026-06-12T08:00:00Z',
  },
  {
    id: 'exp005',
    name: '知识问答优化',
    description: '优化知识库问答的提示词精度',
    promptContent: '你是一位知识问答助手，请根据用户问题从以下上下文中找到准确答案。\n\n上下文：{{context}}\n用户问题：{{question}}\n\n要求：1. 仅根据上下文回答 2. 如无答案请说明 3. 引用来源段落',
    variables: [
      { name: 'context', defaultValue: '' },
      { name: 'question', defaultValue: '' },
    ],
    sampleInputs: [
      { id: 's008', name: '退款政策', values: { context: '本店支持7天无理由退款，需保持商品完好。食品类不支持退货。', question: '买了3天的食品能退款吗？' } },
    ],
    results: [
      { id: 'r007', sampleInputId: 's008', sampleName: '退款政策', output: '根据上下文，食品类商品不支持退货。虽然您购买仅3天，在7天无理由退款期限内，但食品类属于不支持退货的品类，因此无法退款。', rating: 5, createdAt: '2026-06-11T14:00:00Z' },
    ],
    versions: [
      { id: 'v005', experimentId: 'exp005', content: '你是一位知识问答助手，请根据用户问题从以下上下文中找到准确答案。\n\n上下文：{{context}}\n用户问题：{{question}}\n\n要求：1. 仅根据上下文回答 2. 如无答案请说明 3. 引用来源段落', variables: [{ name: 'context', defaultValue: '' }, { name: 'question', defaultValue: '' }], createdAt: '2026-06-11T13:00:00Z', avgRating: 5.0, runCount: 1, note: '初版效果不错', versionNumber: 1 },
    ],
    comments: [
      { id: 'c004', author: '赵六', avatar: 'https://picsum.photos/id/338/200/200', content: '引用来源段落这个要求很好，减少幻觉', createdAt: '2026-06-11T15:00:00Z' },
    ],
    status: 'stable',
    tags: ['问答', '知识库', '精度'],
    createdAt: '2026-06-11T13:00:00Z',
    updatedAt: '2026-06-11T15:00:00Z',
  },
];

export const mockFragments: Fragment[] = [
  { id: 'frag001', title: '角色设定-专业助手', content: '你是一位专业的{{role}}，拥有丰富的{{field}}经验。', category: '角色设定', isTeamTemplate: true, isFavorite: true, usageCount: 23, createdAt: '2026-05-20T10:00:00Z' },
  { id: 'frag002', title: '输出格式-列表', content: '请按以下格式输出：\n1. {{item_1}}\n2. {{item_2}}\n3. {{item_3}}', category: '输出格式', isTeamTemplate: true, isFavorite: true, usageCount: 18, createdAt: '2026-05-21T10:00:00Z' },
  { id: 'frag003', title: '约束条件-字数限制', content: '回复不超过{{max_length}}字，语言简洁精炼。', category: '约束条件', isTeamTemplate: false, isFavorite: false, usageCount: 15, createdAt: '2026-05-22T10:00:00Z' },
  { id: 'frag004', title: '语气风格-亲切', content: '请用亲切友好的语气回复，像朋友一样交流。', category: '语气风格', isTeamTemplate: true, isFavorite: true, usageCount: 31, createdAt: '2026-05-23T10:00:00Z' },
  { id: 'frag005', title: '多语言翻译', content: '请将以下内容翻译为{{target_lang}}，保持原文语气和风格：', category: '功能模板', isTeamTemplate: true, isFavorite: false, usageCount: 12, createdAt: '2026-05-24T10:00:00Z' },
  { id: 'frag006', title: '分析框架-SWOT', content: '请从以下四个维度进行分析：\n- 优势(S)：{{strengths}}\n- 劣势(W)：{{weaknesses}}\n- 机会(O)：{{opportunities}}\n- 威胁(T)：{{threats}}', category: '分析框架', isTeamTemplate: false, isFavorite: false, usageCount: 8, createdAt: '2026-05-25T10:00:00Z' },
  { id: 'frag007', title: '角色设定-创意写手', content: '你是一位富有创意的{{type}}写手，擅长{{style}}风格。', category: '角色设定', isTeamTemplate: false, isFavorite: false, usageCount: 19, createdAt: '2026-05-26T10:00:00Z' },
  { id: 'frag008', title: '输出格式-表格', content: '请用表格形式展示，包含以下列：{{columns}}', category: '输出格式', isTeamTemplate: true, isFavorite: false, usageCount: 14, createdAt: '2026-05-27T10:00:00Z' },
  { id: 'frag009', title: '约束条件-禁止事项', content: '回复中不要包含以下内容：{{forbidden}}。请严格遵守。', category: '约束条件', isTeamTemplate: false, isFavorite: false, usageCount: 7, createdAt: '2026-05-28T10:00:00Z' },
  { id: 'frag010', title: '语气风格-正式商务', content: '请用正式的商务用语回复，措辞严谨、逻辑清晰。', category: '语气风格', isTeamTemplate: true, isFavorite: false, usageCount: 22, createdAt: '2026-05-29T10:00:00Z' },
];
