# How to release
This is a quick howto so I don't forget how to squash commits and push code
up to github when it's release-time.

## Entry Situation
Remotes are setup like this:
```
github	git@github.com:skalio/teambeamjs.git (fetch)
github	git@github.com:skalio/teambeamjs.git (push)
origin	git@karlsruhe.inside.teambeam.net:teambeamjs.git (fetch)
origin	git@karlsruhe.inside.teambeam.net:teambeamjs.git (push)
```

The following remote branches exist:
* `origin/master`: Where development is done
* `github/master`: Releases to the public

Additionally, local (feature) branches may exist.

## WiP
While fixing stuff and and adding new functionality, work in local branch
`master`, tracking `origin/master`. Commit often, referencing trac tickets in
the commit messages, and push to `origin/master`.

## Preparing a release
Once all work for a release is done, perform these steps:

1. `README.md`: update documentation as necessary; update revision history
at the bottom; commit
1. `package.json`: update version number; commit "Lifting version to v0.x.y"
1. **not sure about this:** ~tag the commit: `git tag -a v0.x.y -m "version 0.x.y"`~
1. push everything up to `origin`: `git push origin master v0.x.y` **without the tag I think**

## Squashing commits
The github releases don't need to show the individual WiP commit history, so
we squash them:

1. Create a local release branch: `git checkout -b release`
1. Find the first commit since the previous release: `git log --oneline`
1. Soft-Reset to it: `git reset --soft <commitId>`
1. Combine all changes into a single commit: `git commit --amend`, but change the commit message to "Lifting version to v0.x.y"
1. Confirm that the result is no different from master: `git diff master` shall show nothing
1. Tag the commit: `git tag -a v0.x.y -m "version 0.x.y"`

## Release to Github
1. Push everything up, but make sure it ends up in github's master branch: `git push github release:master v0.x.y`

Github should now show a single new commit as well as a new release.

## Back to work
1. switch back to master: `git checkout master`
1. delete the release branch again: `git branch -D release`

