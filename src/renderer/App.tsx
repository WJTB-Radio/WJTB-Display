import { QueryClient, QueryClientProvider, QueryKey, UndefinedInitialDataOptions, useQueries, useQuery } from '@tanstack/react-query';
import icon from '../../assets/icon.svg';
import './App.css';
import { getNYCTime, getNYCWeekday, getWeekdayString } from './time';
import { ReactNode, useEffect, useReducer } from 'react';
import moment, { Moment } from 'moment';

const defaultQueryFn = async ({queryKey}: {queryKey: QueryKey}) => {
	const res = await fetch(queryKey[0] as string);
	return res.json();
};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryFn: defaultQueryFn,
		},
	},
})

type Show = {name: string, desc: string, hosts: string, poster: string, start_time: number, end_time: number, day: number, is_running: number};
type DayResponse = {shows: Show[]};
function DisplayApp() {
	let queries: UndefinedInitialDataOptions<unknown, Error, unknown, QueryKey>[] = [];
	for(let i = 0; i < 5; i++) {
		let day = getWeekdayString(i);
		queries.push({queryKey: [`https://raw.githubusercontent.com/WJTB-Radio/ShowData/master/${day}.json`], });
	}
	const results = useQueries({
		queries,
	});

	const [, forceUpdate] = useReducer(x => x + 1, 0);
	
	let playingShow: Show | undefined;
	let playingShowDay: number | undefined;
	let nextShow: Show | undefined;
	let nextShowDay: number | undefined;

	const currentDay = getNYCWeekday();
	const time = getNYCTime();

	for(let i = 0; i < 5; i++) {
		let d = (currentDay+i)%5;
		if(results[d].status != "success") {
			continue;
		}
		let data = results[i].data as DayResponse;
		if(data == null || !Object.hasOwn(data, "shows")) {
			continue;
		}
		if(d < 0) {
			continue; // weekend
		}
		if(i == 0 && currentDay >= 0) {
			playingShow = data.shows.find((show) => {
				return show.is_running && show.start_time <= time && show.end_time > time;
			});
			if(playingShow) {
				playingShowDay = d;
			}
		}
		if(!nextShow) {
			nextShow = data.shows.find((show) => {
				return show.is_running && show.start_time >= time || d > currentDay;
			});
			if(nextShow) {
				nextShowDay = d;
			}
		}
	}

	// update when the playing show should change
	useEffect(() => {
		let updateTime: number | undefined;
		if(playingShow) {
			updateTime = (playingShow.end_time-time)*1000+1000;
		} else if(nextShow && nextShowDay) {
			updateTime = (nextShow.start_time-time+(nextShowDay-currentDay)*(24*60*60))*1000+1000;
		}
		if(updateTime) {
			const timeout = window.setTimeout(() => {
				forceUpdate();
			}, updateTime);
			return () => {
				window.clearTimeout(timeout);
			};
		}
	});

	let nextShowMoment: Moment | undefined;
	if(nextShow != null && nextShowDay != null) {
		nextShowMoment = moment().add((nextShow.start_time-time+(nextShowDay-currentDay)*(24*60*60)), "seconds");
	}

	let playingShowMoment: Moment | undefined;
	if(playingShow != null && playingShowDay != null) {
		playingShowMoment = moment().add((playingShow.end_time-time+(playingShowDay-currentDay)*(24*60*60)), "seconds");
	}

	//nextShow = {name: "test show", desc: "desc", start_time: 10, end_time: 100, day: 1, hosts: "", is_running: 1, poster: "https://raw.githubusercontent.com/WJTB-Radio/ShowData/master/images/8c386ea7394dce7b9fd9427d2fc90414.jpg"};
	//playingShow = undefined;

	return (
		<div className="container">
			{(playingShow != null && playingShowMoment != null)?
			<div className="now-playing">
				<div className="now-playing-text">
					<h1>Now Playing</h1>
					<h2>
						{playingShow.name}
					</h2>
					<Countdown moment={playingShowMoment} prefix="ends " />
				</div>
				<img src={playingShow.poster} />
			</div>:undefined}
			{(nextShow != null && nextShowMoment != null)?
			<div className="up-next">
				<div className="up-next-text">
					<h1>Up next</h1>
					<h2>
						{nextShow.name}
					</h2>
					<Countdown moment={nextShowMoment} prefix="starts " />
				</div>
				{
					(nextShow != null && playingShow == null)?<img src={nextShow.poster}></img>:undefined
				}
			</div>:undefined}
		</div>
	);
}

function Countdown({moment, prefix}: {moment: Moment, prefix?: string}) {
	const [, forceUpdate] = useReducer(x => x + 1, 0);
	const relativeTime = moment.fromNow();
	useEffect(() => {
		const interval = window.setInterval(() => {
			if(relativeTime != moment.fromNow()) {
				forceUpdate();
			}
		}, 1000);
		return () => {
			window.clearInterval(interval);
		};
	}, [relativeTime, forceUpdate]);
	return (
		<p>
			{
			prefix == null?
			moment.fromNow():
			`${prefix}${moment.fromNow()}`
			}
		</p>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<DisplayApp />
		</QueryClientProvider>
	);
}
