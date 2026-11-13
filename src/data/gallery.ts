/**
 * 生活画廊（Gallery）。
 *
 * 定位：不属于任何一个项目的「项目技术之外」的记录。
 * 包含两类内容：
 *   1. 项目相关但没进正文的现场照片（实习现场、调研、测试环境）
 *   2. 完全独立于项目的个人记录（风景、日常、校园）
 *
 * 每个画廊（Gallery）是一组有共同主题的照片，
 * 点进去可以看到每一张的完整记录 —— 拍摄背景、当时在想什么。
 *
 * 素材来源：~/Desktop/作品集材料/<项目>/Gallery/
 * 只使用实际存在的照片，没有放 Gallery 素材的项目不生成画廊。
 */

export interface GalleryPhoto {
  src: string
  /** 这张照片的标题 */
  caption: string
  /** 拍摄背景 / 当时发生了什么 */
  note: string
  /** 我自己的评论与记录 */
  story: string
  /** 拍摄地点 */
  place?: string
  /** 拍摄时间 */
  date?: string
  /** 宽高比，用于排版（不含 / 形式，如 "4 / 3"） */
  ratio: string
}

export interface GalleryEntry {
  /** 画廊 slug，用于路由 */
  slug: string
  /** 画廊标题 */
  title: string
  /** 一句话副标题 */
  subtitle: string
  /** 分类标签：现场 / 旅途 / 校园 等 */
  category: string
  /** 画廊封面 */
  cover: string
  coverRatio: string
  /** 画廊导语 */
  intro: string
  photos: GalleryPhoto[]
}

/**
 * 图片尺寸 → 比例。
 *
 * 现场照片基本是 4:3，手机随手拍是 4:3 或 3:4，
 * 业务洽谈那张偏竖（2000×1780）。统一写成 "w / h" 供模板用。
 */
const ratio = (w: number, h: number) => `${w} / ${h}`

export const galleries: GalleryEntry[] = [
  /* ---------------------------------------------------------------- */
  /*  Moca —— 神经接口实验室                                           */
  /* ---------------------------------------------------------------- */
  {
    slug: 'moca',
    title: '神经接口实验室',
    subtitle: '一年半的病房与实验室',
    category: '现场',
    cover: '/img/gallery/moca-shi-yan-shi-wai-jing.webp',
    coverRatio: ratio(1500, 2000),
    intro:
      '这是我做过最长的项目，一年半，从拿到原始量表和数据，到最后的实验结果下载。这组照片记的是那些不在代码里的部分：病房的走廊、听不懂的组会、实验室楼下的傍晚。',
    photos: [
      {
        src: '/img/gallery/moca-shen-zhi-di-er-ren-min-yi-yuan-cai-ji.webp',
        caption: '深圳第二人民医院 · 病房采集',
        note: '在神经内科病房为患者采集运动想象（MI）数据，受试者戴着电极帽躺在病床上，医护在旁边守着。',
        story:
          '这是我第一次在真实病房里跑自己的软件。之前在实验室一切正常，一进病房就发现串口会因为护士推床进出的电磁干扰丢包。之前写的重连逻辑在这里几乎每分钟触发一次 —— 那种真实环境才暴露出的问题，模拟器永远测不出来。',
        place: '深圳第二人民医院',
        date: '2026-09',
        ratio: ratio(2000, 1499),
      },
      {
        src: '/img/gallery/moca-shi-yan-ce-shi-mi-cai-ji.webp',
        caption: '实验测试 · MI 采集',
        note: '在实验室做运动想象范式的完整采集流程验证，同步记录 EEG 信号与打标事件。',
        story:
          '范式调优基本是在这里反复试出来的。同样是想象右手举起，问法不一样，诱发响应强度能差出一倍。试验了十几种引导语，最后定下来的那版并不是理论最优的那版，而是老人最容易听懂的那版。',
        place: '神经接口实验室',
        date: '2026-08',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/moca-ce-shi-da-biao-zu-jian-he-xia-wei-ji-de-lian-jie.webp',
        caption: '打标组件与下位机的连接',
        note: '自研打标设备通过串口直连 EEG 采集设备，实测端到端打标延迟在 20ms 量级。',
        story:
          '刚开始打标不稳定，数值乱飞，后来调整了好久才发现是线的问题，才额外做了映射系统。',
        place: '神经接口实验室',
        date: '2026-05',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/moca-ce-shi-da-biao-yan-chi.webp',
        caption: '测试打标延迟',
        note: '用连续发送测试逐帧核对收发时序，定位丢包与延迟的来源。',
        story:
          '20ms 级打标精度不是靠运气，是靠能看见每一帧收发。这块调试界面的日志功能，后来成了整套系统最常被用的部分 —— 现场出问题第一个动作就是打开它看时间戳。',
        place: '神经接口实验室',
        date: '2026-08',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/moca-shi-yan-shi-wai-jing.webp',
        caption: '实验室外景',
        note: '神经接口实验室所在的研究所外景，夏天傍晚。',
        story:
          '每天下班从这条路上走过。做到后半年已经能一眼看出今天哪层楼还亮着灯 —— 亮着的大概就是在等信号跑完的那几个人。',
        place: '深圳 · 西丽',
        date: '2026-08',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/moca-da-men-wai-jing.webp',
        caption: '研究所大门',
        note: '每天上班的第一张图和最后一张图。',
        story: '早上来的时候通常还没人，晚上走的时候灯已经关得差不多了。',
        place: '深圳 · 西丽',
        date: '2026-10',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/moca-xing-zheng-lou-ji-ji.webp',
        caption: '行政楼阶梯',
        note: '研究所行政楼前的台阶，中午休息时最热闹。',
        story:
          '在这里上班的都是各行各业的翘楚人物，我希望我也是。',
        place: '深圳 · 西丽',
        date: '2026-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/moca-zhong-ke-yuan-xian-jin-ka.webp',
        caption: '中科院先进院',
        note: '研究院的咖啡角，午后总有人在这里讨论。',
        story:
          '时不时困了，路过来杯咖啡，我最爱喝的是拿铁。',
        place: '深圳 · 西丽',
        date: '2026-05',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/moca-ting-zu-hui.webp',
        caption: '听组会',
        note: '实验室的周组会，轮流汇报进展。',
        story:
          '根本听不懂博士们在讲什么，有时候觉得自己真的很笨。',
        place: '神经接口实验室',
        date: '2026-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/moca-hai-bao.webp',
        caption: '学术海报',
        note: '实验室墙上的学术海报，师兄做的那版范式。',
        story:
          '有时候看到这些宣传标语，才发觉，自己正在走一条伟大而艰巨的路。',
        place: '神经接口实验室',
        date: '2026-08',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/moca-gong-wei.webp',
        caption: '我的工位',
        note: '两台显示器、一台采集设备、一堆杜邦线的工作台。',
        story:
          '每个人都有自己的小黄鸭来 debug，而我的，是奶龙师兄。',
        place: '神经接口实验室',
        date: '2026-09',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/moca-tu-shu-guan-wai-jing.webp',
        caption: '图书馆外景',
        note: '研究所图书馆，晚饭后常去。',
        story:
          '这里是我的自修时间。有段时间在读信号处理的书补基础 —— 之前做的是工程，做的是「怎么让它跑起来」，不是「为什么它有效」，这两者的差距我一直想补上。',
        place: '深圳 · 西丽',
        date: '2026-10',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/moca-ti-yu-chang.webp',
        caption: '体育场',
        note: '研究所旁的运动场，下班后的固定行程。',
        story:
          '写代码久了肩颈最先出问题。跑步是我能坚持下来的解压方式 —— 脑子里那些排不进去的 bug，反而在跑的时候自己冒出来。',
        place: '深圳 · 西丽',
        date: '2026-09',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/moca-jian-shen-fang.webp',
        caption: '健身房',
        note: '所里的健身房，器材不多但够用。',
        story: '时不时中午吃完饭来练一下力量，我最喜欢练胸。',
        place: '深圳 · 西丽',
        date: '2026-11',
        ratio: ratio(1500, 2000),
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  CGA-Smart —— 医院与临床一线                                       */
  /* ---------------------------------------------------------------- */
  {
    slug: 'cga',
    title: '临床一线',
    subtitle: '病房、护士站与量表',
    category: '现场',
    cover: '/img/gallery/cga-zheng-zai-he-zhi-ban-yi-shi-hu-gou-tong-you-hua-xi-tong-she-ji.webp',
    coverRatio: ratio(1500, 2000),
    intro:
      '做老年综合评估系统的那几个月，我的角色一半是开发者、一半是产品经理 —— 因为大部分需求不是坐在工位上想出来的，是在病房里跟医生护士聊出来的。',
    photos: [
      {
        src: '/img/gallery/cga-zheng-zai-he-zhi-ban-yi-shi-hu-gou-tong-you-hua-xi-tong-she-ji.webp',
        caption: '与值班医生护士沟通系统设计',
        note: '在护士站与值班医护逐条过评估流程，确认每个环节的可行性。',
        story:
          '这一下午推翻了我原本的设计。原方案是让评估员在平板上独立完成全部 21 条量表，但护士说实际流程是「护士先问基础信息、评估员再补充」——两个人来回切屏根本没法用。方案改成双角色协作，评估员端和护士端分开，才真正跑得起来。',
        place: '康颐养医院',
        date: '2026-08',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/cga-can-kao-de-his-xi-tong-zhong-de-xin-li-liang-biao.webp',
        caption: '参考 HIS 系统中的心理量表',
        note: '调研医院现有 HIS 系统里已有的心理量表，确认我们的设计不重复造轮子。',
        story:
          '做之前先去看别人怎么做的。这套量表在 HIS 里已经有了，但只做记录、不做解释、也没有风险提示。我们最终补上的正是「解释」这一层 —— 让分数能直接变成一个可以跟家属讨论的结论。',
        place: '康颐养医院',
        date: '2026-08',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/cga-ye-wu-qia-tan.webp',
        caption: '业务洽谈',
        note: '与院方讨论部署形态、落地成本与后续运维方式。',
        story:
          '这次洽谈里最关键的一句话是院方问的：「这套东西要多少钱。」之前我一直在想怎么证明它好，直到被问成本，才真正开始算硬件门槛 —— 最后落地成迷你主机加平板，五千以内。技术选型的很多判断，其实是被这类问题逼出来的。',
        place: '康颐养医院',
        date: '2026-08',
        ratio: ratio(1780, 2000),
      },
      {
        src: '/img/gallery/cga-kang-yi-yang-yuan-jie-shao.webp',
        caption: '康颐养医院介绍',
        note: '合作方康颐养医院的外景与设施。',
        story: '这是系统最终落地的机构。住院部、康复区、认知训练室，是这套评估系统每天要面对的真实场景。',
        place: '广州 · 康颐养医院',
        date: '2026-08',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/cga-guang-zhou-gang-kang-yi-yang-yuan.webp',
        caption: '广州港康颐养医院',
        note: '另一家合作机构的院区环境。',
        story: '为了解决平板和服务器的协作问题，我们最后决定用上 4G CPE，直接移动部署就好了。',
        place: '广州 · 港康颐养医院',
        date: '2026-09',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/cga-kang-yi-yang-nei-bu-zou-lang.webp',
        caption: '康颐养内部走廊',
        note: '住院区走廊，评估动线的实际场景。',
        story: '第一次来，感觉到非常奢华。',
        place: '广州 · 康颐养医院',
        date: '2026-09',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/cga-guang-dong-sheng-lao-nian-yi-xue-yan-jiu-suo.webp',
        caption: '广东省老年医学研究所',
        note: '对接的省级研究机构，量表与评估规范的专业来源。',
        story:
          '量表的临床依据来自这里。开发规范、评分口径、解释话术都是他们给的 —— 这一点很重要：技术做得再漂亮，如果解释不符合临床惯例，医生是不会采信的。',
        place: '广州',
        date: '2026-08',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/cga-guang-dong-sheng-ren-min-yi-yuan.webp',
        caption: '广东省人民医院',
        note: '临床验证的合作医院。',
        story: '系统在这里做跨机构验证。也正是在不同机构之间跑，才暴露出我在单机构测试里完全没发现的一致性问题。',
        place: '广州',
        date: '2026-08',
        ratio: ratio(1500, 2000),
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  防返贫 —— 海口与对外交付                                          */
  /* ---------------------------------------------------------------- */
  {
    slug: 'fupan',
    title: '走南闯北',
    subtitle: '海口的两个月与路上的风景',
    category: '旅途',
    cover: '/img/gallery/fupan-hai-dao-wan-xia.webp',
    coverRatio: ratio(2000, 1500),
    intro:
      '这是我第一次在热带岛屿工作，时常被天气多变和凉爽的海风感动。这组照片记的是那两个月的日常 —— 工位、海滩、老街，和不需要写进周报的部分。',
    photos: [
      {
        src: '/img/gallery/fupan-hai-dao-wan-xia.webp',
        caption: '海岛晚霞',
        note: '公司外的海滩，傍晚退潮后的天空。',
        story:
          '改到 7 点，出门就能看到这个。',
        place: '海口',
        date: '2026-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/fupan-gong-si-wai-de-hai-tan.webp',
        caption: '公司外的海滩',
        note: '办公区步行十分钟能到的海滩。',
        story: '这是我见过最近的 beach break office。海南的夏天很热，但傍晚的海风确实能把一整天的烦躁吹掉。',
        place: '海口',
        date: '2026-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/fupan-men-kou-de-ye-zi-shu.webp',
        caption: '门口的椰子树',
        note: '办公楼下的一排椰子树。',
        story: '每天上班路过都会看一眼。它长得比刚来时快了不少。',
        place: '海口',
        date: '2026-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/fupan-hai-kou-qi-lou.webp',
        caption: '海口骑楼',
        note: '海口老城区的骑楼老街，南洋风格的老建筑。',
        story:
          '骑楼是海口最有意思的地方 —— 一楼是店铺，二楼以上住人，阳台几乎连成一片。交付期间住得近，休息时会走过去走走。这座城市比想象中安静。',
        place: '海口 · 老城区',
        date: '2026-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/fupan-you-ke-zhao.webp',
        caption: '游客照',
        note: '在海边的一张随拍。',
        story: '这张本来是发给家人的，被我留下来了。',
        place: '海口',
        date: '2026-07',
        ratio: ratio(2000, 1520),
      },
      {
        src: '/img/gallery/fupan-yan-fa-bu-men-pai.webp',
        caption: '研发部门牌',
        note: '数智科技研发部门所在楼层的门牌。',
        story:
          '第一次来的时候觉得很有意思，最后一次走的时候已经被工作麻木了。',
        place: '海口 · 数智科技',
        date: '2026-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/fupan-ban-gong-lou-wai-jing.webp',
        caption: '办公楼外景',
        note: '办公园区的一角。',
        story: '仿照美式的建筑，当地人叫做小白宫。',
        place: '海口',
        date: '2026-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/fupan-gong-wei.webp',
        caption: '工位',
        note: '驻外期间的工位，一个笔记本加一台显示器。',
        story:
          '驻外条件比学校简陋，但反而效率高 —— 没有研发环境在旁边随时打断，能连着把一个 Agent 的工具链从头写完。',
        place: '海口 · 数智科技',
        date: '2026-07',
        ratio: ratio(2000, 1500),
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  招投标 —— 中国电信调研与部署                                       */
  /* ---------------------------------------------------------------- */
  {
    slug: 'bidos',
    title: '从需求到部署',
    subtitle: '一次真实的政企交付现场',
    category: '现场',
    cover: '/img/gallery/bidos-vllm-pei-zhi-de-dual-spark.webp',
    coverRatio: ratio(1500, 2000),
    intro:
      'BidOS 这个项目真正难的部分不在代码，在于要把它跑进一个真实的企业环境里。这组照片是那次交付调研时拍的 —— 机房、办公室、还有那台专门为推理采购的服务器。',
    photos: [
      {
        src: '/img/gallery/bidos-vllm-pei-zhi-de-dual-spark.webp',
        caption: 'vLLM 配置的 dualSpark 服务器',
        note: '为本地部署采购的推理服务器，配置 vLLM 作为推理引擎。',
        story:
          '这是整个项目里最贵的一件东西。甲方最初的要求是「模型必须跑在客户内网」，但预算只允许买一台机器。所以推理服务必须做共享 —— 一个 vLLM 实例同时服务多个场景，把资源利用率压到极限才勉强够用。采购、部署、调优的那两周，我把这台机器的性能曲线翻来覆去测了很多遍。',
        place: '客户内网机房',
        date: '2026-10',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/bidos-ye-wu-diao-yan.webp',
        caption: '业务调研',
        note: '与招标业务人员逐条核对标书编制流程与痛点。',
        story:
          '调研的时候我才真正明白「读文档」和「读要求」的差别。业务人员做标书的方式，是把招标文件拆成一堆条目逐条打勾；而我们最初设计的是让模型通读全文写摘要。方向从这时就转了。',
        place: '客户现场',
        date: '2026-09',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/bidos-ye-wu-diao-yan-2.webp',
        caption: '业务调研 · 续',
        note: '调研的后续环节，确认材料清单与交付物格式。',
        story:
          '这次调研里最有用的一句话是「我们十年攒下来的标书都在一个共享盘里」。那批没被整理过的历史标书，后来成了知识库建设的基础 —— 23 份历史稿件，就是从这样的共享盘里一份份扒出来的。',
        place: '客户现场',
        date: '2026-09',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/bidos-shu-ju-qi-ji-wang-zuo.webp',
        caption: '服务器及工位',
        note: '现场部署环境的服务器与开发工位。',
        story: '客户给我们的部署环境和开发环境差别很大，这让「模型配置外置」从一个技术选项变成了必须。',
        place: '客户现场',
        date: '2026-10',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/bidos-zhu-lou-wai-jing.webp',
        caption: '主楼外景',
        note: '客户单位的主楼，交付期间的驻场地点。',
        story: '驻场那段时间每天都要刷卡进这道门。',
        place: '客户单位',
        date: '2026-09',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/bidos-shi-yan-shi-zou-lang.webp',
        caption: '实验室走廊',
        note: '场地内部的走廊。',
        story: '交付期间走这条走廊的次数比走自己实验室还多。',
        place: '客户单位',
        date: '2026-09',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/bidos-shu-zi-hua-bu-ban-gong-shi.webp',
        caption: '数字化部办公室',
        note: '客户数字化部的工作环境，团队最终交接给他们的地方。',
        story:
          '这是我第一次意识到「交付」的真正含义 —— 不是代码跑通，是有人能接着用下去。所以系统里所有的模型配置都做成了可在界面调整，甲方同事不用找我们就能自己换模型。',
        place: '客户单位 · 数字化部',
        date: '2026-10',
        ratio: ratio(1500, 2000),
      },
    ],
  },
  /* ---------------------------------------------------------------- */
  /*  多元发展 —— 国际化视野与课外                                      */
  /* ---------------------------------------------------------------- */
  {
    slug: 'multi',
    title: '多元发展',
    subtitle: '国际化视野与项目之外的成长',
    category: '拓展',
    cover: '/img/gallery/multi-ma-liu-jia-hai-xia-de-ri-chu.webp',
    coverRatio: ratio(2000, 1500),
    intro:
      '技术之外的那些部分：一次中美联合课题、一段在新加坡的暑期、一门辅修的无人机课。这张照片画廊记录的是项目表格装不下的东西 —— 我在课堂之外、实验室之外长大的那些部分。',
    photos: [
      {
        src: '/img/gallery/multi-zhong-mei-ping-ping-qiu-guan-jun.webp',
        caption: '中美交流 · 我们是乒乓球冠军',
        note: '中美学生交流活动，乒乓球友谊赛上我们拿下了冠军。',
        story:
          '赛前没人练过多久，纯粹靠业余爱好打下来的。但那种「明明都不太会打却都拼得很凶」的气氛，是实验室里很难遇到的东西 —— 在那里，聪明是默认的，在这里，赢球靠的是不放弃。',
        place: '国内 · 中美交流营',
        date: '2025-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/multi-jie-ying-zheng-shu.webp',
        caption: '结营证书',
        note: '中美交流项目的结营证书。',
        story:
          '证书本身没什么特别，但拿到它的时候才真切地意识到：这是我第一次以「学生」而不是「开发者」的身份参与一件事 —— 不需要我写任何代码。',
        place: '国内',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-shi-yan-shi-nei-jing.webp',
        caption: '大云屋工作室',
        note: '交流期间参观的工作室，3D 打印机、PCB 印刷机与各类装备一应俱全。',
        story:
          '这是大云屋的工作室，里面有 3D 打印机、PCB 印刷机和各种装备。硬件这一块我完全是外行 —— 机器怎么调、材料怎么选、样件怎么打出来，这些都不是写代码能替代的。第一次意识到：一个想法要变成能摸到的东西，中间隔着整整一条我不会的技能链。',
        place: '国内',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-yu-yu-wei-shi-he-ying.webp',
        caption: '与鱼尾狮合影',
        note: '新加坡河畔的经典打卡点。',
        story:
          '第一次到新加坡。这张照片旁边就是那座狮身鱼尾像 —— 当时觉得它有点夸张，后来看多了反而喜欢上了这种「把传说做成实物」的做法。',
        place: '新加坡 · 河畔',
        date: '2025-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/multi-ma-liu-jia-hai-xia-de-ri-chu.webp',
        caption: '太平洋的日出',
        note: '一大早从酒店出发走向海边，等一场日出。',
        story:
          '一大早从酒店出发走向海边，就为了看太平洋的日出。海面很安静，天一点点亮起来的过程比想象中长 —— 那种不赶时间的早晨，在行程很满的这几天里显得格外珍贵。',
        place: '马来西亚 · 马六甲',
        date: '2025-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/multi-hao-hua-da-ba-che-piao.webp',
        caption: '豪华大巴车票',
        note: '新加坡到马六甲的跨境大巴票。',
        story:
          '票根留下来了。这种细节后来在整理相册时经常冒出来 —— 它们比照片更能说明「我确实走过那段路」。',
        place: '新加坡 → 马六甲',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-jiao-tang.webp',
        caption: '新加坡圣公会教堂',
        note: '殖民时期留下的教堂建筑，绿树与彩色玻璃窗。',
        story:
          '新加坡的很多建筑都带着殖民时期的痕迹，但它们没有被当成历史包袱，而是变成了这个城市风景的一部分。技术之外，这种「怎么对待旧东西」的思路挺启发我的。',
        place: '新加坡',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-jiao-tang-nei-jing.webp',
        caption: '教堂内景',
        note: '教堂内部的彩色玻璃窗。',
        story:
          '光从彩窗打进来的时候，颜色落在石板地上。我在那儿站了很久，什么也没想 —— 这在项目密集的那两年里是很奢侈的事。',
        place: '新加坡',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-xin-jia-po-qing-zhen-si.webp',
        caption: '新加坡清真寺',
        note: '苏丹回教堂，洋葱顶与藤蔓纹样。',
        story:
          '东南亚的宗教建筑几乎都有这种繁复的植物纹样。国内的清真寺我只在书上见过 —— 亲自站在下面，那种尺度感完全不一样。',
        place: '新加坡',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-lai-fu-shi-hua-yuan.webp',
        caption: '来福士花园',
        note: '新加坡的空中花园与城市天际线。',
        story:
          '在顶层看了整个新加坡。一个多世纪前这里是一片沼泽，现在能俯瞰整个港城 —— 这种变化速度，是我做工程时不太会去想的事。',
        place: '新加坡 · 乌节路',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-bo-wu-guan-wai-jing.webp',
        caption: '国家博物馆外景',
        note: '新加坡国家博物馆，白色殖民风格建筑。',
        story: '去博物馆是为了看一场关于马来半岛的展。看完之后才明白这个国家的位置有多尴尬 —— 夹在几条巨大的文明之间。',
        place: '新加坡',
        date: '2025-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/multi-guo-jia-bo-wu-guan-li-de-li-shi-ji-lu.webp',
        caption: '博物馆里的历史记录',
        note: '馆内关于新加坡建国历程的展陈。',
        story:
          '展陈把一个多元移民国家的形成过程讲得很清楚 —— 语言、宗教、族群，全在一栋楼里交错。那一刻我想到自己在做的东西：防返贫 Agent 要解决的也是「不同来源的数据怎么对得上」。',
        place: '新加坡 · 国家博物馆',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-zai-xin-jia-po-bo-wu-guan-liu-yan.webp',
        caption: '在新加坡国家博物馆留言',
        note: '在馆内的留言墙上写下的字。',
        story:
          '留言墙是博物馆给访客留的。我当时写了什么现在也看不太清了，只记得犹豫了很久 —— 在一个全是陌生语言的地方写字，比说话更需要勇气。',
        place: '新加坡 · 国家博物馆',
        date: '2025-07',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-shu-dong.webp',
        caption: '树洞',
        note: '校园里的网红树洞装置。',
        story:
          '国内高校里这种装置不多见，有种「把情绪可视化」的意味。写留言的人大概不会想太多，但树洞本身的存在就是一种允许。',
        place: '国内 · 校园',
        date: '2025-09',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/multi-dao-you-de-ying-guo-shen-shi.webp',
        caption: '导游的英国绅士',
        note: '行程中的导游，标准的英式幽默与礼节。',
        story:
          '从英国人的视角听殖民历史，导游说殖民带来了文明。客观讲这话不算全错 —— 客观上确实有技术、制度的输出 —— 但对殖民地人民造成的伤害也是实打实的。这一半一半的评价，比非黑即白更接近历史本身。',
        place: '新加坡',
        date: '2025-07',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/multi-hu-lian-wang-da-sai.webp',
        caption: '互联网+ 大赛',
        note: '参加互联网+ 大赛的现场。',
        story:
          '比赛那几天在打磨路演。评委的问题比评委的评分更让我在意 —— 有个问题当场就把我问住了，那天晚上改到两点。',
        place: '国内',
        date: '2025-08',
        ratio: ratio(2000, 1500),
      },
      {
        src: '/img/gallery/multi-fu-xiu-de-wu-ren-ji-ke-cheng.webp',
        caption: '辅修的无人机专业课',
        note: '辅修专业的课堂，飞行原理与实操。',
        story:
          '这是我这几年做过的最不「有用」的一门课。飞控、空气动力、姿态估计 —— 和我的 EEG 解码研究八竿子打不着。但学完之后再看待无人机俯拍的脑电实验机位，忽然能理解一些以前只是照着做的参数为什么是那样。',
        place: '国内 · 校园',
        date: '2025-10',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-cheng-guo-kt-ban.webp',
        caption: '成果 KT 版',
        note: '团队成果展示的 KT 版面。',
        story:
          '把一段时间的成果排成一面墙。排版的过程其实是一次强制总结 —— 哪些真的做出来了、哪些只是想过，能一眼看出来。',
        place: '国内',
        date: '2025-11',
        ratio: ratio(1500, 2000),
      },
      {
        src: '/img/gallery/multi-sheng-li-hui-shi.webp',
        caption: '胜利会师',
        note: '与合作伙伴的会师合影。',
        story:
          '照片里每个人都在笑，但只有我们知道前一周是怎么熬过来的。这种「共同熬过某件事」的关系，比任何履历上的描述都牢。',
        place: '国内',
        date: '2025-12',
        ratio: ratio(1475, 2000),
      },
    ],
  },

]

export const getGallery = (slug: string) => galleries.find((g) => g.slug === slug)
