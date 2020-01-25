"use strict";

const loopback = require("loopback");
const boot = require("loopback-boot");

const app = (module.exports = loopback());

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit("started");
    const baseUrl = app.get("url").replace(/\/$/, "");
    console.log("Web server listening at: %s", baseUrl);
    if (app.get("loopback-component-explorer")) {
      const explorerPath = app.get("loopback-component-explorer").mountPath;
      console.log("Browse your REST API at %s%s", baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) app.start();
});

app.models.user.find((error, result) => {
  if (result.length === 0) {
    const user = {
      email: "sy@sy.com",
      password: "test",
      username: "sy"
    };

    app.models.user.create(user, (error, result) => {
      console.log("Tried to create user", error, result);
    });
  }
});

app.models.user.afterRemote("create", (ctx, user, next) => {
  console.log("New User is", user);
  app.models.Profile.create(
    {
      first_name: user.username,
      created_at: new Date(),
      userId: user.id
    },
    (error, result) => {
      if (!error && result) {
        console.log("Created new profile!", result);
      } else {
        console.log("There is an error", error);
      }
      next();
    }
  );
});

app.models.Role.find({ where: { name: "admin" } }, (error, role) => {
  if (!error && role) {
    console.log("No error, role is", role);
    if (role.length === 0) {
      app.models.Role.create(
        {
          name: "admin"
        },
        (error2, result) => {
          if (!error2 && result) {
            app.models.user.findOne((usererror, user) => {
              if (!usererror && user) {
                result.principals.create(
                  {
                    principalType: app.models.RoleMapping.USER,
                    principalId: user.id
                  },
                  (error3, principal) => {
                    console.log("Created principal", error3, principal);
                  }
                );
              }
            });
          }
        }
      );
    }
  }
});

app.models.Role.find({ where: { name: "editor" } }, (error, roles) => {
  if (!error && roles) {
    if (roles.length === 0) {
      app.models.Role.create(
        {
          name: "editor"
        },
        (creationErr, result) => {
          console.log(creationErr, result);
        }
      );
    }
  }
});
