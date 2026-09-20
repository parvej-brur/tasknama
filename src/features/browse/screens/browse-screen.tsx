import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ScreenHeader } from "@/components/layout/screen-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { IconName } from "@/components/ui/icon-tile";
import { ListRow } from "@/components/ui/list-row";
import { ProgressBar } from "@/components/ui/progress-bar";
import { selectLiveSession } from "@/features/focus/selectors";
import {
  selectActiveProjects,
  selectArchivedProjects,
  selectProjectProgress,
} from "@/features/projects/selectors";
import { selectAllTags, selectTagCounts } from "@/features/tags/selectors";
import { useAppSelector } from "@/lib/store/hooks";
import { useTheme, type TintName } from "@/theme";

// A pastel shortcut card for a destination that isn't one of the daily tabs.
function Tile({
  icon,
  tint,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  tint: TintName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const t = useTheme();
  const { bg, fg } = t.tint(tint);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: "45%",
        minHeight: 124,
        justifyContent: "space-between",
        gap: t.spacing.md,
        padding: t.spacing.lg,
        borderRadius: t.radius.lg,
        backgroundColor: bg,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: t.palette.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={fg} />
      </View>
      <View>
        <Text style={[t.type.bodyStrong, { color: t.palette.text }]}>{title}</Text>
        <Text numberOfLines={2} style={[t.type.caption, { color: t.palette.text, opacity: 0.8 }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// A compact pill action for a section header. The visible pill is 32 pt tall; hitSlop keeps the tap target at 44.
function HeaderAction({
  label,
  icon,
  trailingIcon,
  onPress,
  filled,
}: {
  label: string;
  icon?: IconName;
  trailingIcon?: IconName;
  onPress: () => void;
  filled?: boolean;
}) {
  const t = useTheme();
  const fg = t.palette.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={({ pressed }) => ({
        height: 32,
        flexDirection: "row",
        alignItems: "center",
        gap: t.spacing.xs,
        paddingLeft: icon ? t.spacing.sm + 2 : t.spacing.md,
        paddingRight: trailingIcon ? t.spacing.sm : t.spacing.md,
        borderRadius: t.radius.pill,
        backgroundColor: filled ? t.palette.primaryMuted : "transparent",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <Text style={[t.type.label, { color: fg }]}>{label}</Text>
      {trailingIcon ? <Ionicons name={trailingIcon} size={14} color={fg} /> : null}
    </Pressable>
  );
}

// Browse: projects, tags, and everything that isn't a daily view.
export function BrowseScreen() {
  const t = useTheme();
  const router = useRouter();
  const projects = useAppSelector(selectActiveProjects);
  const archived = useAppSelector(selectArchivedProjects);
  const tags = useAppSelector(selectAllTags);
  const progress = useAppSelector(selectProjectProgress);
  const tagCounts = useAppSelector(selectTagCounts);
  const live = useAppSelector(selectLiveSession);

  return (
    <View style={{ flex: 1, backgroundColor: t.palette.background }}>
      <ScreenHeader title="Browse" subtitle="Everything else" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.spacing.lg,
          paddingBottom: t.spacing.xxl * 2,
          gap: t.spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.md }}>
          <Tile icon="list" tint="blue" title="All tasks" subtitle="Search, filter and sort" onPress={() => router.push("/tasks/all")} />
          <Tile icon="checkmark-done" tint="purple" title="Completed" subtitle="Look back at finished work" onPress={() => router.push("/completed")} />
          <Tile
            icon="timer"
            tint="amber"
            title="Focus"
            subtitle={live ? (live.status === "running" ? "Session in progress" : "Session paused") : "One task at a time"}
            onPress={() => router.push("/focus")}
          />
          <Tile icon="stats-chart" tint="slate" title="Productivity" subtitle="Your week at a glance" onPress={() => router.push("/productivity")} />
        </View>

        <View style={{ height: t.spacing.sm }} />
        <SectionHeader
          title="Projects"
          count={projects.length || undefined}
          action={<HeaderAction label="New" icon="add" filled onPress={() => router.push("/project/new")} />}
        />
        <View style={{ gap: t.spacing.md }}>
          {projects.length === 0 ? (
            <ListRow
              icon="add"
              tint="blue"
              title="Create your first project"
              subtitle="Group related tasks and track progress"
              onPress={() => router.push("/project/new")}
            />
          ) : (
            projects.map((project) => {
              const { done, total } = progress[project.id] ?? { done: 0, total: 0 };
              return (
                <ListRow
                  key={project.id}
                  title={project.name}
                  dot={t.projectColor(project.color)}
                  subtitle={`${done} of ${total} done`}
                  onPress={() => router.push({ pathname: "/project/[id]", params: { id: project.id } })}
                >
                  <View style={{ marginTop: t.spacing.xs }}>
                    <ProgressBar done={done} total={total} color={t.projectColor(project.color)} height={6} label={`${project.name} progress`} />
                  </View>
                </ListRow>
              );
            })
          )}
          {archived.length > 0 ? (
            <ListRow
              icon="archive-outline"
              tint="amber"
              title="Archived projects"
              subtitle={`${archived.length} archived. Restore them here.`}
              onPress={() => router.push("/projects/archived")}
            />
          ) : null}
        </View>

        <View style={{ height: t.spacing.sm }} />
        <SectionHeader
          title="Tags"
          count={tags.length || undefined}
          action={<HeaderAction label="Manage" trailingIcon="chevron-forward" onPress={() => router.push("/tags")} />}
        />
        {tags.length === 0 ? (
          <ListRow icon="pricetag-outline" tint="purple" title="No tags yet" subtitle="Add #tags when you create a task" />
        ) : (
          <Card style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
            {tags.slice(0, 12).map((tag) => (
              <Chip
                key={tag.id}
                label={`#${tag.name}`}
                badge={String(tagCounts[tag.id] ?? 0)}
                accessibilityLabel={`Tag ${tag.name}, ${tagCounts[tag.id] ?? 0} tasks`}
                onPress={() => router.push({ pathname: "/tag/[id]", params: { id: tag.id } })}
              />
            ))}
          </Card>
        )}

        <View style={{ height: t.spacing.lg }} />
        <ListRow icon="settings-outline" tint="slate" title="Settings" subtitle="Appearance, reminders and your data" onPress={() => router.push("/settings")} />
        <Text style={[t.type.caption, { color: t.palette.textMuted, textAlign: "center", marginTop: t.spacing.lg }]}>
          Task Manager {Constants.expoConfig?.version ?? ""} · Your data stays on this device
        </Text>
      </ScrollView>
    </View>
  );
}
