import { Info, Moon, Network, SlidersHorizontal, Sun } from "lucide-react"

import { navItems, type SectionKey, type ThemeMode } from "@/lib/constants"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export function AppSidebar({
  section,
  onSectionChange,
  theme,
  onToggleTheme,
  onOpenAdvanced,
  onOpenAbout,
}: {
  section: SectionKey
  onSectionChange: (section: SectionKey) => void
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenAdvanced: () => void
  onOpenAbout: () => void
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="代理管理系统">
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Network className="size-4.5" />
              </div>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-semibold tracking-tight">
                  代理管理系统
                </span>
                <span className="truncate font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  Proxy Console
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      type="button"
                      tooltip={item.label}
                      isActive={section === item.key}
                      onClick={() => onSectionChange(item.key)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="高级设置"
              onClick={onOpenAdvanced}
            >
              <SlidersHorizontal />
              <span>高级设置</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip={theme === "dark" ? "切换浅色" : "切换深色"}
              onClick={onToggleTheme}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
              <span>{theme === "dark" ? "浅色模式" : "深色模式"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton type="button" tooltip="关于与更新" onClick={onOpenAbout}>
              <Info />
              <span>关于与更新</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
