export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

// all of the libraries to do this are very general purpose, and so have a lot of bloat for our purposes
// please keep this updated if we ever change our dst rules
export function getNYCDate() {
	let d = new Date();
	let secondSundayOfMarch = new Date(d.getFullYear(), 2, 1);
	// advance by two sundays, one day at a time
	for(let i = 0; i < 2; i++) {
		while(secondSundayOfMarch.getDay() != 0) {
			secondSundayOfMarch.setDate(secondSundayOfMarch.getDate() + 1);
		}
		secondSundayOfMarch.setDate(secondSundayOfMarch.getDate() + 1);
	}
	secondSundayOfMarch.setDate(secondSundayOfMarch.getDate() - 1);
	// obv, exact times arent too important since we arent running shows at 2am, but this should be correct i think
	secondSundayOfMarch.setHours(2);
	let firstSundayOfNovember = new Date(d.getFullYear(), 10, 1);
	// advance until we reach the first sunday
	while(firstSundayOfNovember.getDay() != 0) {
		firstSundayOfNovember.setDate(firstSundayOfNovember.getDate() + 1);
	}
	firstSundayOfNovember.setHours(2);
	let utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	
	let offset = -5;
	if(d > secondSundayOfMarch && d < firstSundayOfNovember) {
		offset = -4;
	}
	var nyc = new Date(utc + (3600000*offset));
	return nyc;
}

export function getNYCTime() {
	var nyc = getNYCDate();
	var nyc_seconds = nyc.getHours()*60*60+nyc.getMinutes()*60+nyc.getSeconds();
	return nyc_seconds;
}

export function getNYCWeekday() {
	var nyc = getNYCDate();
	let d = nyc.getDay()-1;
	if(d == 5) {
		d = -2;
	}
	return d;
}

export function getWeekdayString(day: number): DayOfWeek {
	return ["monday", "tuesday", "wednesday", "thursday", "friday"][Math.abs(day % 5)] as DayOfWeek;
}

export function getNYCWeekdayString(): DayOfWeek {
	return getWeekdayString(getNYCWeekday());
}

export function formatTime(time: number) {
	let hours = Math.floor(time / (60*60));
	let minutes = String((time/60)%60).padStart(2, '0');
	let suffix = "am";
	if(hours > 12) {
		hours -= 12;
		suffix = "pm";
	} else if(hours == 12) {
		suffix = "pm";
	}
	if(hours == 0) {
		hours = 12;
		suffix = "am";
	}
	return `${hours}:${minutes}${suffix}`
}

export function formatTimes(start_time: number, end_time: number) {
	return `${formatTime(start_time)} - ${formatTime(end_time)}`
}

export function formatDay(day: string) {
	return day.charAt(0).toUpperCase() + day.slice(1);
}