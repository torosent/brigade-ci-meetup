const {
  events,
  Job,
  Group
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

  var status = e.cause.trigger;
  if (status !== "success") {
      status = "failure";
  }
  
  var gh = new Job("gh");
  gh.image = "technosophos/github-notify:latest"
  gh.env = {
    GH_REPO: project.repo.name,
    GH_STATE: status,
    GH_DESCRIPTION: "brigade says YES!",
    GH_CONTEXT: "brigade",
    GH_TOKEN: project.repo.token,
    GH_COMMIT: e.commit,
  };
  Group.runEach([gh]);
}
