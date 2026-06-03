import { useState, type ReactNode } from "react"
import { Download, Loader2, Network, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { command, commandErrorMessage, type ServiceInfo } from "@/lib/api"
import type { UpdateInfo, VersionInfo } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"

export function AboutDialog({
  open,
  onOpenChange,
  version,
  serviceInfo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: VersionInfo | null
  serviceInfo: ServiceInfo | null
}) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [checking, setChecking] = useState(false)
  const [installing, setInstalling] = useState(false)

  async function handleCheck() {
    setChecking(true)
    try {
      const info = await command<UpdateInfo>("check_for_updates")
      setUpdateInfo(info)
      if (info.hasUpdate) {
        toast.success(`发现新版本 ${info.latest?.version}`)
      } else {
        toast.info("当前已是最新版本")
      }
    } catch (error) {
      toast.error(commandErrorMessage(error, "检查更新失败"))
    } finally {
      setChecking(false)
    }
  }

  async function handleInstall() {
    if (!updateInfo?.latest) return

    setInstalling(true)
    try {
      const result = await command<{ message?: string }>("install_update", {
        artifactPath: updateInfo.latest.path,
      })
      toast.success(result.message ?? "已启动更新安装程序")
      onOpenChange(false)
    } catch (error) {
      toast.error(commandErrorMessage(error, "安装更新失败"))
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>关于</DialogTitle>
          <DialogDescription>版本信息与 GitHub Release 更新检查</DialogDescription>
        </DialogHeader>

        {/* A. 关于信息区 —— 强化版本展示 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-md border bg-card/40 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Network className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-tight">代理管理系统</div>
              <div className="truncate text-xs text-muted-foreground">
                Proxy Manager · Rust · Tauri · shadcn/ui
              </div>
            </div>
            <div className="flex flex-col items-end leading-none">
              <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground/70">
                version
              </span>
              <span className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-primary">
                v{version?.version ?? "—"}
              </span>
            </div>
          </div>

          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {version?.runtime && <Meta label="Runtime" value={version.runtime} />}
            {version?.platform && (
              <Meta label="Platform" value={version.platform} />
            )}
            {version?.arch && <Meta label="Arch" value={version.arch} />}
            {serviceInfo && (
              <Meta label="代理端口" value={serviceInfo.proxy_port} />
            )}
          </div>
        </div>

        <Separator />

        {/* B. 更新区 */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">检查更新</div>
            <p className="text-xs text-muted-foreground">
              开发环境禁止检查更新；生产环境从 GitHub Releases 获取更新包。私有仓库需要在运行环境中设置 ZWFW_LOAD_GITHUB_TOKEN。
            </p>
          </div>

          {updateInfo ? (
            <FieldGroup>
              <Field>
                <FieldLabel>当前版本</FieldLabel>
                <FieldDescription className="font-mono tabular-nums">
                  {updateInfo.currentVersion}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>更新来源</FieldLabel>
                <FieldDescription className="font-mono tabular-nums">
                  {updateInfo.source}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>安装目录</FieldLabel>
                <FieldDescription className="font-mono break-all">
                  {updateInfo.appDir}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>更新包目录</FieldLabel>
                <FieldDescription className="font-mono break-all">
                  {updateInfo.releaseDir}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>更新状态</FieldLabel>
                <FieldDescription>
                  {updateInfo.hasUpdate && updateInfo.latest
                    ? `发现新版本 ${updateInfo.latest.version}`
                    : "未发现高于当前版本的更新包"}
                </FieldDescription>
              </Field>
              {updateInfo.latest && (
                <Field>
                  <FieldLabel>候选更新包</FieldLabel>
                  <FieldDescription className="font-mono break-all">
                    {updateInfo.latest.fileName}
                  </FieldDescription>
                </Field>
              )}
            </FieldGroup>
          ) : (
            <p className="text-sm text-muted-foreground">
              尚未执行更新检查，点击下方「检查更新」获取 GitHub Release 信息。
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCheck} disabled={checking}>
            {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            检查更新
          </Button>
          <Button
            onClick={handleInstall}
            disabled={!updateInfo?.latest || installing}
          >
            {installing ? <Loader2 className="animate-spin" /> : <Download />}
            安装更新
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-1.5">
      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span className="truncate font-mono text-sm tabular-nums text-foreground/90">
        {value}
      </span>
    </div>
  )
}
