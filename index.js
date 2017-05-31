/*
MIT License

Copyright (c) 2017 Graham White

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
 Library to exercise the British Gas Hive version 6 API
 Based on the work of James Saunders at
 http://www.smartofthehome.com/2016/05/hive-rest-api-v6/
*/

'use strict';

var request = require('request');

var hive = module.exports = {};

/**
 * Config object to change the behaviour of the module
 */
hive.config = {
  username:'',
  password:'',
  endpoint:'https://api-prod.bgchprod.info:443/omnia',
  idleMinutes: 20,
  accessTime: 0,
  headers: {
    'Content-Type': 'application/vnd.alertme.zoo-6.1+json',
    'Accept': 'application/vnd.alertme.zoo-6.1+json',
    'X-Omnia-Client': 'Hive Web Dashboard'
  }
}

/**
 * Initialises the config object
 * Allows any part of the config to be overridden
 * Requires at least config.username and config.password are set
 */
hive.init = function(config) {
  Object.assign(hive.config,config);
}

/**
 * Determines if a new login attempt is required
 * Works out if an API call has been made recently (defaults to 20 minutes)
 * Returns a boolean
 */
hive.needToLogin = function() {
  var epoch = new Date().getTime();
  if ((epoch - hive.config.accessTime) / 60000 < hive.config.idleMinutes)
    return false;
  else
    return true;
}

/**
 * Login to Hive
 * Requires a valid hive.config object has been set
 * Returns a Promise which is resolved with nothing or rejected with an error
 */
hive.login = function() {
  return new Promise(function(resolve,reject) {
    if (!hive.needToLogin()) {
      resolve();
    } else {
      var body = {
        sessions: [{
          username: hive.config.username,
          password: hive.config.password,
          caller: 'WEB'
        }]
      }

      var options = {
        url: hive.config.endpoint + "/auth/sessions",
        headers: hive.config.headers,
        method: 'POST',
        body: JSON.stringify(body)
      }

      hive.config.accessTime = new Date().getTime();
      request(options, function(error, response, body) {
        try {
          var responseJson = JSON.parse(body);
        } catch(e) {
          reject({err:e});
        }
        if (!error && response.statusCode == 200) {
          hive.config.headers['X-Omnia-Access-Token'] = responseJson.sessions[0].sessionId;
          resolve();
        } else if (responseJson.error) {
          reject(responseJson);
        } else if (error) {
          reject(error);
        } else {
          reject({error:"Unknown error"});
        }
      });
    }
  })
}

/**
 * Wrapper function to divert to a real hive API call after a login attempt
 */
hive.loginAndThen = function (hiveCB, cb) {
  hive.login().then(function(result) {
    hiveCB(cb);
  }, function(err) {
    cb(err);
  });
}

/**
 * Wrapper function to API call to make sure there is a valid login
 */
hive.getDevices = function(cb) {
  hive.loginAndThen(hive._getDevices, cb);
}

/**
 * Get all devices
 * Should not be called directly, use the wrapper function getDevices() to ensure a login first
 * Returns to the callback a JSON Object of devices or an error object or array of errors
 */
hive._getDevices = function(cb) {
  var options = {
    url: hive.config.endpoint + "/nodes",
    headers: hive.config.headers,
    method: 'GET',
  }

  hive.config.accessTime = new Date().getTime();
  request(options, function(error, response, body) {
    try {
      var responseJson = JSON.parse(body);
    } catch(e) {
      cb({err:e});
    }
    if (!error && response.statusCode == 200) {
      cb(responseJson);
    } else if (responseJson.error) {
      cb(responseJson);
    } else if (error) {
      cb(error);
    } else {
      cb({error:"Unknown error"});
    }
  });
}

/**
 * Get the current state of the heating relay
 * Returns to the callback "ON", "OFF", "unknown" or an error object or array of errors
 */
hive.heatingIsOn = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var stateHeatingRelay = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHeatingRelay) {
          stateHeatingRelay = result.nodes[i].attributes.stateHeatingRelay.reportedValue || "unknown";
          break;
        }
      }
      cb(stateHeatingRelay);
    }
  })
}

/**
 * Get the current "in room" heating temperature
 * Returns to the callback the temperature as a string or "unknown" or an error object or array of errors
 */
hive.getInRoomTemperature = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var temperature = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHeatingRelay) {
          temperature = result.nodes[i].attributes.temperature.reportedValue || "unknown";
          break;
        }
      }
      cb(temperature);
    }
  })
}

/**
 * Get the target heating temperature
 * Returns to the callback the temperature as a string or "unknown" or an error object or array of errors
 */
hive.getTargetHeatTemperature = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var targetHeatTemperature = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHeatingRelay) {
          targetHeatTemperature = result.nodes[i].attributes.targetHeatTemperature.reportedValue || "unknown";
          break;
        }
      }
      cb(targetHeatTemperature);
    }
  })
}

/**
 * Get the frost protect temperature
 * Returns to the callback the temperature as a string or "unknown" or an error object or array of errors
 */
hive.getFrostProtectTemperature = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var frostProtectTemperature = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHeatingRelay) {
          frostProtectTemperature = result.nodes[i].attributes.frostProtectTemperature.reportedValue || "unknown";
          break;
        }
      }
      cb(frostProtectTemperature);
    }
  })
}

/**
 * Get the minimum heating temperature
 * Returns to the callback the temperature as a string or "unknown" or an error object or array of errors
 */
hive.getMinHeatTemperature = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var minTemperature = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHeatingRelay) {
          minTemperature = result.nodes[i].attributes.minHeatTemperature.reportedValue || "unknown";
          break;
        }
      }
      cb(minTemperature);
    }
  })
}

/**
 * Get the maximum temperature
 * Returns to the callback the temperature as a string or "unknown" or an error object or array of errors
 */
hive.getMaxHeatTemperature = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var maxTemperature = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHeatingRelay) {
          maxTemperature = result.nodes[i].attributes.maxHeatTemperature.reportedValue || "unknown";
          break;
        }
      }
      cb(maxTemperature);
    }
  })
}

/**
 * Get the current heating schedule
 * Returns to the callback the schedule as a object or "unknown" or an error object or array of errors
 */
hive.getHeatingSchedule = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var heatingSchedule = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHeatingRelay) {
          heatingSchedule = result.nodes[i].attributes.schedule.reportedValue || "unknown";
          break;
        }
      }
      cb(heatingSchedule);
    }
  })
}

/**
 * Get the current state of the hot water relay
 * Returns to the callback "ON", "OFF", "unknown" or an error object or array of errors
 */
hive.hotWaterIsOn = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var stateHotWaterRelay = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHotWaterRelay) {
          stateHotWaterRelay = result.nodes[i].attributes.stateHotWaterRelay.reportedValue || "unknown";
          break;
        }
      }
      cb(stateHotWaterRelay);
    }
  })
}

/**
 * Get the current hot water schedule
 * Returns to the callback the schedule as a object or "unknown" or an error object or array of errors
 */
hive.getHotWaterSchedule = function(cb) {
  hive.getDevices(function(result) {
    if (result.error || result.errors) {
      cb(result);
    } else {
      var hotWaterSchedule = "unknown";
      for (var i=0; i<result.nodes.length; i++) {
        if (result.nodes[i].name === "Receiver" && result.nodes[i].attributes.stateHotWaterRelay) {
          hotWaterSchedule = result.nodes[i].attributes.schedule.reportedValue || "unknown";
          break;
        }
      }
      cb(hotWaterSchedule);
    }
  })
}
