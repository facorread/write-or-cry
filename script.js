/* This file is part of Write or Cry: A clone of Dr. Wicked's Write or Die
Copyright (C) 2020 Fabio Correa facorread@gmail.com

https://github.com/facorread/write-or-cry
https://gitlab.com/facorread/write-or-cry

Write or Cry is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Write or Cry is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Write or Cry.  If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";

function init() {
	var renderDate = new Date();
	darkMode.enable = true;
	keyUp.duration = [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]; // Milliseconds spent writing the last 20 words. Circular buffer.
	keyUp.durationIndex = 0;
	keyUp.latestTimeStamp = renderDate.getTime();
	keyUp.ellipsis = 0;
	ticker.enabled = false;
	ticker.idle = 0;
	ticker.seconds = 0;
	restoreState();
	setInterval(ticker, 1000);
}

window.onload = init;
window.onunload = saveState;

function restoreState() {
	if (typeof (Storage) !== "undefined") {
		var userText = localStorage.getItem("com.fabio.writeOrDie.userText");
		if (!isEmpty(userText)) {
			document.getElementById("user-text").innerHTML = userText;
		}
		var dMode = localStorage.getItem("com.fabio.writeOrDie.darkMode");
		darkMode.enable = !(dMode == "f");
		var speedGoal = localStorage.getItem("com.fabio.writeOrDie.speedGoal");
		if (!isEmpty(speedGoal)) {
			setSpeedGoalImpl(speedGoal);
		} else {
			setSpeedGoalImpl(10);
		}
		var timeGoal = localStorage.getItem("com.fabio.writeOrDie.timeGoal");
		if (!isEmpty(timeGoal)) {
			setTimeGoalImpl(timeGoal);
		} else {
			setTimeGoalImpl(10);
		}
		var wordGoal = localStorage.getItem("com.fabio.writeOrDie.wordGoal");
		if (!isEmpty(wordGoal)) {
			setWordGoalImpl(wordGoal);
		} else {
			setWordGoalImpl(100);
		}
		var goalLock = localStorage.getItem("com.fabio.writeOrDie.goalLock");
		if (goalLock == "t") {
			document.getElementById('speed-lock').checked = false;
			document.getElementById('time-lock').checked = true;
			document.getElementById('word-lock').checked = false;
		} else if (goalLock == "w") {
			document.getElementById('speed-lock').checked = false;
			document.getElementById('time-lock').checked = false;
			document.getElementById('word-lock').checked = true;
		} else {
			document.getElementById('speed-lock').checked = true;
			document.getElementById('time-lock').checked = false;
			document.getElementById('word-lock').checked = false;
		}
		var showMeter = !(localStorage.getItem("com.fabio.writeOrDie.showMeter") == "f");
		document.getElementById('writing-speed-meter').hidden = !showMeter;
		document.getElementById('speed-meter-checkbox').checked = showMeter;
		var showTimeBar = !(localStorage.getItem("com.fabio.writeOrDie.showTimeBar") == "f");
		document.getElementById('time-bar').hidden = !showTimeBar;
		document.getElementById('time-bar-checkbox').checked = showTimeBar;
		var showProgressBar = !(localStorage.getItem("com.fabio.writeOrDie.showProgressBar") == "f");
		document.getElementById('progress-bar').hidden = !showProgressBar;
		document.getElementById('word-bar-checkbox').checked = showProgressBar;
	} /* Else Sorry! No Web Storage support... */
	darkModeImpl();
	document.getElementById("idle-counter").hidden = true;
	keyUp.latestWordCounter = countWords();
}

function saveState() {
	if (typeof (Storage) !== "undefined") {
		localStorage.setItem("com.fabio.writeOrDie.userText", document.getElementById("user-text").innerHTML);
		localStorage.setItem("com.fabio.writeOrDie.darkMode", darkMode.enable ? "t" : "f");
		localStorage.setItem("com.fabio.writeOrDie.speedGoal", document.getElementById("speed-goal").value);
		localStorage.setItem("com.fabio.writeOrDie.timeGoal", document.getElementById("time-goal").value);
		localStorage.setItem("com.fabio.writeOrDie.wordGoal", document.getElementById("word-goal").value);
		if (document.getElementById('time-lock').checked) {
			localStorage.setItem("com.fabio.writeOrDie.goalLock", "t");
		} else if (document.getElementById('word-lock').checked) {
			localStorage.setItem("com.fabio.writeOrDie.goalLock", "w");
		} else {
			localStorage.setItem("com.fabio.writeOrDie.goalLock", "s");
		}
		localStorage.setItem("com.fabio.writeOrDie.showMeter", document.getElementById("speed-meter-checkbox").checked ? "t" : "f");
		localStorage.setItem("com.fabio.writeOrDie.showTimeBar", document.getElementById("time-bar-checkbox").checked ? "t" : "f");
		localStorage.setItem("com.fabio.writeOrDie.showProgressBar", document.getElementById("word-bar-checkbox").checked ? "t" : "f");
	} /* Else Sorry! No Web Storage support... */
}

function darkModeImpl() {
	if (darkMode.enable) {
		darkMode.color = "white";
		darkMode.userTextBackground = "black";
		darkMode.toolbarBackground = "#004040";
		document.getElementById("play-pause").style.filter = "invert(100)";
		document.getElementById("play-pause").style.border = "1px solid #ff8080";
	} else {
		darkMode.color = "black";
		darkMode.userTextBackground = "white";
		darkMode.toolbarBackground = "#40B0B0";
		document.getElementById("play-pause").style.filter = "none";
		document.getElementById("play-pause").style.border = "1px solid #008080";
	}
	document.body.style.color = darkMode.color;
	document.body.style.backgroundColor = darkMode.userTextBackground;
	document.getElementById("toolbar").style.backgroundColor = darkMode.toolbarBackground;
	document.getElementById("popup").style.backgroundColor = darkMode.toolbarBackground;
	colorize();
}

function darkMode() {
	darkMode.enable = !darkMode.enable;
	darkModeImpl();
}

function colorize() {
	// Colorize the background
	if (darkMode.enable) {
		var red = Math.trunc(ticker.idle / 2) * 4;
		if (red > 230) {
			red = 230;
		}
		var newBackgroundColor = "rgb(" + red + ", 0, 0)";
		document.body.style.backgroundColor = newBackgroundColor;
	} else {
		var gb = 255 - (Math.trunc(ticker.idle / 2) * 4);
		if (gb < 30) {
			gb = 30;
		}
		var newBackgroundColor = "rgb(255, " + gb + ", " + gb + ")";
		document.body.style.backgroundColor = newBackgroundColor;
	}
}

function playPause() {
	var playButton = document.getElementById('play-pause');
	var popup = document.getElementById('popup');
	var userText = document.getElementById('user-text');
	if (ticker.enabled) {
		playButton.style.backgroundImage = 'url("play_arrow.svg")';
		userText.contentEditable = false;
		userText.style.color = "gray";
		ticker.enabled = false;
		popup.hidden = false;
	} else {
		playButton.style.backgroundImage = 'url("pause.svg")';
		ticker.enabled = true;
		popup.hidden = true;
		userText.contentEditable = true;
		userText.style.color = darkMode.color;
	}
	saveState();
}

function reset() {
	if (ticker.seconds > 0) {
		ticker.seconds = 0;
		document.getElementById('timer').innerHTML = '0:00 elapsed';
		document.getElementById('time-bar').value = 0;
	}
}

function setSpeedGoalImpl(speedGoalFloat) {
	var speedGoalElement = document.getElementById('speed-goal');
	var speedGoal = Math.round(speedGoalFloat);
	speedGoalElement.value = speedGoal;
	var meterElement = document.getElementById('writing-speed-meter');
	meterElement.max = 1.5 * speedGoal + 2;
	meterElement.optimum = speedGoal + 1;
	meterElement.high = speedGoal;
}

function setTimeGoalImpl(timeGoalFloat) {
	var timeGoalElement = document.getElementById('time-goal');
	var timeGoal = Math.round(timeGoalFloat);
	timeGoalElement.value = timeGoal;
	document.getElementById('time-bar').max = timeGoal * 60;
}

function setWordGoalImpl(wordGoalFloat) {
	var wordGoalElement = document.getElementById('word-goal');
	var wordGoal = Math.round(wordGoalFloat);
	wordGoalElement.value = wordGoal;
	document.getElementById('progress-bar').max = wordGoal;
}

function getValue(name) {
	return parseInt(document.getElementById(name).value);
}

function setSpeedGoal() {
	reset();
	var speedGoal = getValue('speed-goal');
	if (document.getElementById('word-lock').checked) {
		var wordGoal = getValue('word-goal');
		setTimeGoalImpl(wordGoal / speedGoal);
	} else {
		var timeGoal = getValue('time-goal');
		setWordGoalImpl(speedGoal * timeGoal);
	}
}

function setTimeGoal() {
	reset();
	var timeGoal = getValue('time-goal');
	if (document.getElementById('word-lock').checked) {
		if (timeGoal > 0) {
			var wordGoal = getValue('word-goal');
			setSpeedGoalImpl(wordGoal / timeGoal);
		}
	} else {
		var speedGoal = getValue('speed-goal');
		setWordGoalImpl(speedGoal * timeGoal);
	}
}

function setWordGoal() {
	reset();
	var wordGoal = getValue('word-goal');
	if (document.getElementById('time-lock').checked) {
		var timeGoal = getValue('time-goal');
		setSpeedGoalImpl(wordGoal / timeGoal);
	} else {
		var speedGoal = getValue('speed-goal');
		setTimeGoalImpl(wordGoal / speedGoal);
	}
}

function countWords() {
	var wordBoundaryCounter = 0;
	var userText = document.getElementById("user-text").innerText;
	userText.replace(/\b/g, function (a) {
		wordBoundaryCounter++;
	});
	var wordCounter = wordBoundaryCounter / 2;
	document.getElementById("word-counter").innerHTML = wordCounter + ' words';
	document.getElementById("progress-bar").value = wordCounter;
	return wordCounter;
}

function keyUp() {
	// Hide the idle counter
	document.getElementById("idle-counter").hidden = true;
	document.getElementById("writing-speed").hidden = false;
	document.getElementById("writing-speed-meter").hidden = false;
	ticker.idle = 0;
	document.body.style.backgroundColor = darkMode.userTextBackground;
	// Count words
	var wordCounter = countWords();
	// Render the writing speed
	var renderDate = new Date();
	var timeStamp = renderDate.getTime();
	if (wordCounter == keyUp.latestWordCounter + 1) {
		keyUp.duration[keyUp.durationIndex] = timeStamp - keyUp.latestTimeStamp;
		keyUp.durationIndex++;
		if (keyUp.durationIndex >= keyUp.duration.length) {
			keyUp.durationIndex = 0
		}
		keyUp.latestTimeStamp = timeStamp;
		var writingSpeedElement = document.getElementById("writing-speed");
		var meter = document.getElementById("writing-speed-meter");
		if (keyUp.duration.includes(NaN) || keyUp.duration.includes(0)) {
			if (keyUp.ellipsis == 0) {
				writingSpeedElement.innerHTML = '&centerdot;..wpm';
			} else if (keyUp.ellipsis == 1) {
				writingSpeedElement.innerHTML = '.&centerdot;.wpm';
			} else if (keyUp.ellipsis == 2) {
				writingSpeedElement.innerHTML = '..&centerdot;wpm';
			} else {
				writingSpeedElement.innerHTML = '...wpm';
			}
			keyUp.ellipsis += 1;
			if (!(keyUp.ellipsis < 3)) {
				keyUp.ellipsis = 0;
			}
			meter.value = 0;
		} else {
			var sum = 0;
			var d;
			for (d of keyUp.duration) {
				sum += d;
			}
			var writingSpeed = Math.floor(60000 * keyUp.duration.length / sum);
			writingSpeedElement.innerText = writingSpeed + 'wpm';
			meter.value = writingSpeed;
		}
	}
	keyUp.latestWordCounter = wordCounter;
}

function ticker() {
	if (ticker.enabled) {
		ticker.seconds++;
		document.getElementById("time-bar").value = ticker.seconds;
		var printMinutes = Math.floor(ticker.seconds / 60);
		var printSecondsNum = ticker.seconds % 60;
		var printSeconds = printSecondsNum.toString().padStart(2, '0');
		document.getElementById('timer').innerHTML = printMinutes + ':' + printSeconds + ' elapsed';
		ticker.idle++;
		if (ticker.idle >= 5) {
			document.getElementById("writing-speed").hidden = true;
			document.getElementById("writing-speed-meter").hidden = true;
			var idleCounterElement = document.getElementById("idle-counter");
			idleCounterElement.innerText = ticker.idle + ' seconds idle';
			idleCounterElement.hidden = false;
			colorize();
		}
		if (ticker.seconds % 60 == 0) {
			saveState();
		}
	}
}

function showHideMeter() {
	document.getElementById('writing-speed-meter').hidden = !document.getElementById('speed-meter-checkbox').checked;
}

function showHideTimeBar() {
	document.getElementById('time-bar').hidden = !document.getElementById('time-bar-checkbox').checked;
}

function showHideProgressBar() {
	document.getElementById('progress-bar').hidden = !document.getElementById('word-bar-checkbox').checked;
}

function isEmpty(str) {
	return (!str || 0 === str.length);
}
