/**
 * dsh-sansheng-liubu · 宿主半（占位，0 能力）
 *
 * 它存在的唯一意义：让 cordis Loader 的那一行 `name: dsh-sansheng-liubu` 有东西可 import，
 * 从而让 @deepseek-ai/dsh-client-modules 顺着 Node 解析找到本包 package.json，
 * 再读 `dsh.client.platform: "web"` 与 `exports["./client"]` 去加载浏览器半。
 *
 * 形态选择：**具名导出 `name` + `apply`，不给默认导出**。
 * 理由：cordis 取插件时接受「函数」或「带 apply 的对象」，模块命名空间本身就是这样一个对象，
 * 具名导出既满足它、又避免「默认导出与具名导出各算一个插件」的二义；`name` 与包名一致，日志里能直接认出是谁。
 *
 * 本轮未做：不起服务、不注册工具、不读配置、不 import 任何 @deepseek-ai 包。
 */

export const name = 'dsh-sansheng-liubu'

export function apply() {
  // 占位：宿主侧故意什么都不做。
}
