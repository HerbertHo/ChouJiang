# 幸运翻牌抽奖

一个适合活动、聚会和内部福利发放的在线翻牌抽奖网页。参与者填写手机号后选择卡片，系统随机揭晓奖品并记录抽奖结果；管理员可以通过密码调整奖品和兑奖文案，并查看历史记录。

![幸运翻牌预览](public/og.png)

## 在线体验

[https://s4fb3s3oeadw.meoo.pub](https://s4fb3s3oeadw.meoo.pub)

## 功能

- 参与者必须先填写手机号，无需短信验证码或格式校验
- 每轮只能选择一张卡片，翻开后仅显示奖品文字
- 奖品由云函数安全随机生成，并实时写入抽奖历史
- 管理员可自定义卡片数量与每张卡片对应的奖品内容
- 管理员可自定义中奖后的兑奖提示语
- HISTORY 页面展示手机号、中奖奖品和抽奖时间
- 奖品配置与历史记录保存在 Meoo 云数据库，多设备共享
- 支持手机和桌面浏览器

## 使用方法

### 参与抽奖

1. 打开在线地址。
2. 输入手机号并点击“开始抽奖”。
3. 从卡片中选择一张。
4. 查看中奖结果和兑奖提示。

### 管理奖品

1. 点击 `RESET`。
2. 输入管理员密码。
3. 在“卡片内容”中每行填写一个奖品；行数就是卡片数量。
4. 修改兑奖提示语。
5. 点击“保存并重置”。

### 查看历史

1. 点击 `HISTORY`。
2. 输入管理员密码。
3. 查看所有手机号、中奖奖品和抽奖时间。

管理员密码通过 Meoo Secret `RAFFLE_ADMIN_PASSWORD` 管理，不应写入前端代码或提交到仓库。

## 技术结构

- 前端：HTML、CSS、原生 JavaScript
- 托管：Meoo 静态 CDN
- 数据库：Meoo Cloud PostgreSQL / Supabase
- 后端接口：Meoo Edge Function（Deno）
- 数据安全：数据库启用 RLS，浏览器不能直接读写奖品配置和历史表

## 目录说明

```text
.
├── index.html                  # 抽奖页面
├── styles.css                 # 页面样式
├── script.js                  # 前端交互
├── assets/                    # 页面素材
├── meoo-static/
│   ├── dist/                  # Meoo CDN 发布文件
│   ├── functions/raffle-api/  # 抽奖、配置和历史接口
│   └── migrations/            # 数据库迁移
└── public/                    # Sites 兼容静态资源
```

## 本地预览

前端静态页面可直接通过本地 HTTP 服务预览：

```bash
python3 -m http.server 4173
```

然后访问 [http://localhost:4173](http://localhost:4173)。云端抽奖接口依赖 Meoo 域名代理，本地预览主要用于检查页面布局；完整功能请使用在线地址。

## Meoo 部署

项目已与 Meoo 项目绑定。更新页面后，将根目录的前端文件同步到 `meoo-static/dist/`，然后在 `meoo-static` 目录发布：

```bash
meoo deploy --skip-build --skip-push --force
```

更新云函数：

```bash
meoo fn deploy raffle-api --no-verify-jwt
```

修改管理员密码：

```bash
meoo secrets set RAFFLE_ADMIN_PASSWORD <新密码>
```

请勿提交 `meoo-static/.env`，其中包含云服务连接配置。

## 隐私提示

项目会保存参与者填写的手机号、中奖奖品和抽奖时间。正式活动前，请明确告知参与者数据用途，并在活动结束后按实际需要清理历史记录。
