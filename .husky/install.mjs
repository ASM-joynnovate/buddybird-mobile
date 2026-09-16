import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"

if (process.env.CI || process.env.HUSKY === "0" || !existsSync(".git")) process.exit(0)

// Git normally shares hooksPath across worktrees; keep this checkout's hook local.
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim()
git("config", "--local", "extensions.worktreeConfig", "true")
process.env.GIT_CONFIG = git("rev-parse", "--git-path", "config.worktree")
const error = (await import("husky")).default()
if (error) throw new Error(error)
