# 自定义 NSIS 逻辑（electron-builder 会自动加载 build/installer.nsh）
#
# 本文件承担三件事：
#   1. 取消 electron-builder 默认的「应用是否在运行」外部探测；
#   2. 在安装目录选择页之后插入「附加任务」页，提供「创建桌面快捷方式」复选框（默认勾选）；
#   3. 安装收尾时按勾选状态保留或删除桌面快捷方式。
#
# 背景 1：默认的 CHECK_APP_RUNNING 会派生 PowerShell / cmd / tasklist 子进程来探测
# 「目标目录下是否还有进程在跑」。在装有终端安全管控软件的 Windows 上，这类子进程
# 调用会失灵，全新安装也会被误判成「应用正在运行且无法关闭」。这里改为不做外部探测。
#
# 背景 2：安装包未做代码签名，本机装有安恒 UES（DAS-Security）。实测该软件会拦截
# NSIS 的 CopyFiles（SHFileOperation）。解压路径的修复在
# scripts/patch-nsis-template.mjs 中完成（7z 直接解压到 $INSTDIR）。
#
# 注意：本文件被 include 到脚本头部，早于 MUI2.nsh，因此不能使用 MUI2 的宏
# （例如 MUI_HEADER_TEXT），页面标题改为直接给 MUI 的 Header 控件发 WM_SETTEXT。

!include "nsDialogs.nsh"

# ---------------------------------------------------------------- 进程探测
!macro customCheckAppRunning
  # 空实现：安装/卸载前不做「是否还有进程在跑」的外部探测。
  # 代价：如果程序确实还开着，覆盖安装会在写文件时报占用，先退出程序重试即可。
  # 收益：不会再出现「全新安装也被判定为无法关闭」的假失败。
!macroend

# 以下内容只属于安装器；卸载器脚本也会 include 本文件，
# 若不加保护，页面函数会因「未被引用」触发 warning 6010，而 electron-builder
# 把警告当作错误。
!ifndef BUILD_UNINSTALLER

Var QoneDesktopShortcutState
Var QoneDesktopCheckbox

# .onInit 阶段初始化：静默安装（/S）不经过页面，必须给默认值，
# 否则收尾逻辑会把「未赋值」误判成「用户取消勾选」。
!macro customInit
  StrCpy $QoneDesktopShortcutState "1"
!macroend

# 目录选择页之后、开始安装之前插入的页面
!macro customPageAfterChangeDir
  Page custom QoneDesktopPageCreate QoneDesktopPageLeave
!macroend

Function QoneDesktopPageCreate
  # 等价于 MUI_HEADER_TEXT（1037 = 标题控件，1038 = 副标题控件）
  GetDlgItem $0 $HWNDPARENT 1037
  SendMessage $0 ${WM_SETTEXT} 0 "STR:选择附加任务"
  GetDlgItem $0 $HWNDPARENT 1038
  SendMessage $0 ${WM_SETTEXT} 0 "STR:请选择安装程序要执行的附加任务，然后单击「安装」。"

  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateCheckbox} 0 0 100% 12u "创建桌面快捷方式(&D)"
  Pop $QoneDesktopCheckbox
  ${NSD_Check} $QoneDesktopCheckbox

  nsDialogs::Show
FunctionEnd

Function QoneDesktopPageLeave
  ${NSD_GetState} $QoneDesktopCheckbox $0
  StrCpy $QoneDesktopShortcutState $0
FunctionEnd

# electron-builder 会按 createDesktopShortcut 配置无条件创建桌面快捷方式，
# 这里在安装收尾时按用户勾选状态回退：未勾选就删掉刚建好的那个。
!macro customInstall
  ${If} $QoneDesktopShortcutState != "1"
    ${If} ${FileExists} "$newDesktopLink"
      Delete "$newDesktopLink"
    ${EndIf}
  ${EndIf}
!macroend

!endif
