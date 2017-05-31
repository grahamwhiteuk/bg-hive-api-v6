# bg-hive-api-v6 - British Gas Hive API version 6
**An INCOMPLETE Library** to exercise the British Gas Hive version 6 API Based on the work of James Saunders on [his blog](http://www.smartofthehome.com/2016/05/hive-rest-api-v6/).  The reason for being incomplete is this is work-in-progress and so future updates will add further support.  Current methods are read-only and sufficient to get many of the settings on a Hive system.

## Installation
This work is not yet published as an npm module so for now you can clone the git repository:
```
git clone https://github.com/grahamwhiteuk/bg-hive-api-v6.git
cd bg-hive-api-v6
npm install
```

## Usage
An example of how to initialise the library and make a call to get the current "in room" temperature.

```javascript
var hive = require('./bg-hive-api-v6');
hive.init({
  username: "<YOUR HIVE USERNAME HERE>",
  password: "<YOUR HIVE PASSWORD HERE>",
});
hive.getInRoomTemperature(function(result) {
  if (result.error || result.errors)
    console.log("D'oh!");
  else
    console.log("Temperature is: " + result);
});
```

## Methods
A list of all the currently supported methods.  Most methods are called by passing a callback (cb) function which receives the returned value(s) or an error object or array of errors.

### General Methods
* **init(config)** initialise the library.  This method *must* be called before any other calls can be made.  You should pass at least the username and password strings as part of a config object.  However, the full config object is displayed below.  You may, for example, choose to update the accessTime and the X-Omnia-Access-Token header if you've previously logged in and want to reuse your existing access token.
```json
username:"<YOUR HIVE USERNAME HERE>",
password:"<YOUR HIVE PASSWORD HERE>",
endpoint:'https://api-prod.bgchprod.info:443/omnia',
idleMinutes: 20,
accessTime: 0,
headers: {
    "Content-Type": "application/vnd.alertme.zoo-6.1+json",
    "Accept": "application/vnd.alertme.zoo-6.1+json",
    "X-Omnia-Client": "Hive Web Dashboard",
    "X-Omnia-Access-Token": "<YOUR TOKEN HERE>"
}
```

* **login()** there is no need to call this method directly as the library takes care of ensuring you always have a valid login.  The login method takes no parameters, it reads from the config object.  A Promise is returned that is resolved upon successful login or rejected upon login failure.

* **getDevices(cb)** returns a devices object (see example responses below) to the callback

### Heating Methods
* **heatingIsOn(cb)** returns a string "ON", "OFF", or "unknown" to the callback that describes whether the heating is currently firing.

* **getInRoomTemperature(cb)** returns a string representing the current "in room" temperature displayed on the thermostat to the callback.  If the temperature is not available but no error was returned, the string "unknown" will be returned.

* **getTargetHeatTemperature(cb)** returns a string representing the target heating temperature to the callback.  If the "in room" temperature is lower than this figure then the heating should be on.  If the "in room" temperature is higher than this figure then the heating should be off.  If the temperature is not available but no error was returned, the string "unknown" will be returned.  Note: when frost protection is active the target heat temperature will be set to 1, hence the frost protect temperature is the effective target heat temperature.

* **getFrostProtectTemperature(cb)** returns a string representing the frost protection temperature to the callback.  The frost protection temperature is used as the lower bound heating temperature to ensure the heating system is not damaged by very cold temperatures.  Typically defaults to 7 degrees.  If the temperature is not available but no error was returned, the string "unknown" will be returned.

* **getMinHeatTemperature(cb)** returns a string representing the minimum heat temperature to the callback.  This is the lower bound of temperatures that will be available for selection on a Hive system.  Typically defaults to 5 degrees.  If the temperature is not available but no error was returned, the string "unknown" will be returned.

* **getMaxHeatTemperature(cb)** returns a string representing the maximum heat temperature to the callback.  This is the upper bound of temperatures that will be available for selection on a Hive system.  Typically defaults to 32 degrees.  If the temperature is not available but no error was returned, the string "unknown" will be returned.

* **getHeatingSchedule(cb)** returns a heatingSchedule object (see example responses below) to the callback that describes the schedule of temperature changes for the heating water system.

### Hot Water Methods
* **hotWaterIsOn(cb)**  returns a string "ON", "OFF", or "unknown" to the callback that describes whether the hot water is currently firing.

* **getHotWaterSchedule(cb)** returns a hotWaterSchedule object (see example responses below) to the callback that describes the schedule of on/off settings for the hot water system.

### Active Plug Methods
None currently supported.

### Active Sensor Methods
None currently supported.

## Example responses

* **heatingSchedule** response contains seven keys, one for each day of the week.  The example below shows a truncated schedule object (only Sunday is shown).  Each day contains six time slots for the heating temperature to be set to a different level.  If fewer than six slots are used on any given day then six slots will still be returned by the API but with the used slots at the end of the array, the remaining slots at the start of the array will be set to the same time and value as the first temperature change of the day.
```json
{  
    "sunday": [
      {
        "time": "06:00",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 18
      },
      {
        "time": "08:00",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 15
      },
      {
        "time": "11:30",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 15
      },
      {
        "time": "13:15",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 15
      },
      {
        "time": "16:30",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 19
      },
      {
        "time": "21:15",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 12
      }
    ]
},
...
```

* **hotWaterSchedule** response contains seven keys, one for each day of the week.  The example below shows a truncated schedule object (only Sunday is shown).  Each day contains six time slots for the hot water to be turned on/off.  If fewer than six slots are used on any given day then six slots will still be returned by the API but with the used slots at the start of the array, the remaining slots at the end of the array will be set to "OFF".
```json
{
    "sunday": [
      {
        "time": "06:30",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 99
      },
      {
        "time": "08:00",
        "heatCoolMode": "OFF",
        "targetHeatTemperature": 0
      },
      {
        "time": "11:30",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 99
      },
      {
        "time": "13:00",
        "heatCoolMode": "OFF",
        "targetHeatTemperature": 0
      },
      {
        "time": "17:00",
        "heatCoolMode": "HEAT",
        "targetHeatTemperature": 99
      },
      {
        "time": "21:00",
        "heatCoolMode": "OFF",
        "targetHeatTemperature": 0
      },
    ]
},
...
```

* **devices** response contains a nodes key that points to an array of Hive devices.  Each device has an ID, URL and name as well as other keys the link to important information about the device.  Each device also has an attributes object that describes the features available on the device as well as the current settings for each feature.  Each device is different in terms of the attributes available, hence it's recommended to run a getDevices() call and inspect the output for your system.
```json
{
    "meta": {},
    "links": {},
    "linked": {},
    "nodes": [
      {
        "id": "ID STRING",
        "href": "URL STRING",
        "name": "DEVICE NAME STRING",
        "attributes": {
          ...
        }
      },
      ...
    ]
}
```
