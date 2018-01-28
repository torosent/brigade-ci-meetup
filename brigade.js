const {
  events,
  Job
} = require("brigadier");

events.on("push", function (e, p) {
  console.log("received push for commit " + e.commit)

  // Create a new job
  var node = new Job("test-runner")
  node.image = "python:3"

  node.tasks = [
    "cd /src/app",
    "pip install -r requirements.txt",
    "cd /src/",
    "python setup.py test"
  ]

  node.run();
});

events.on("after", function (e, project) {
  sendStatusToGithub(e,project);
})

events.on("error", function (e, project) {
  sendStatusToGithub(e,project);
})

function sendStatusToGithub(e,project) {
  var c = e.cause.event
  var m = "Hook " + c.type + " is in state " + e.cause.trigger +
    " for build " + e.commit + " of " + project.repo.name;

  var gh = new Job("gh");
  gh.image = "technosophos/github-notify:latest"
  gh.env = {
    GH_REPO: p.repo.name,
    GH_STATE: e.cause.trigger,
    GH_DESCRIPTION: "brigade says YES!",
    GH_CONTEXT: "brigade",
    GH_TOKEN: p.repo.token,
    GH_COMMIT: e.commit,
  };
  gh.run().then(() => console.log("Status updated: " + m ));
}
