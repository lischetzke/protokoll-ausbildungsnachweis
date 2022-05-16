import React, {useState} from 'react';
import './App.css';

function App() {
	let [startDate, setStartDate] = useState("2020-08-01");
	let [endDate, setEndDate] = useState("2023-07-31");
	let [contentData, setContentData] = useState({});
	let [tableContent, setTableContent] = useState();

	async function updateTable () {
		let dateA = new Date(startDate);
		let dateB = new Date(endDate);
		let difference = dateB.getTime() - dateA.getTime();
		let diffDays = Math.ceil(difference / (1000 * 3600 * 24));

		let workfree: { [key: string]: string } = {};

		// get holidays and free days
		for(let i = dateA.getFullYear(); i < dateB.getFullYear(); i++) {
			// get free days
			let ftapi = await fetch(`https://feiertage-api.de/api/?jahr=${i}&nur_land=HE`);
			let ftapi_json = await ftapi.json();

			for(let i in ftapi_json) {
				let day = ftapi_json[i];
				workfree[`${day.datum}`] = i;
			}
		}

		let output: Array<Object> = [];

		for(let i = 0; i <= diffDays; i++) {
			let d = new Date(dateA);
			d.setDate(d.getDate() + i);

			let df = _df(d);
			let free = (d.getDay() >= 5) ? "Wochenende" : undefined;

			if(workfree[df] !== undefined)
				free = workfree[df];

			let tr = _createTableRow(d, free !== undefined, free || "");
			output.push(tr);
		}

		// @ts-ignore
		setTableContent(output);
	}

	function updateTableContent() {
		let inputObjs = document.getElementsByClassName("user-input");

		for(let i = 0; i < inputObjs.length; i++) {
			// @ts-ignore
			let inputObj: HTMLInputElement = inputObjs[i];
			// @ts-ignore
			let date = inputObj.dataset.date;
			// @ts-ignore
			if(contentData[date]) {
				// @ts-ignore
				inputObj.value = contentData[date];
			}
		}
	}

	function onContentChange(inputObj: EventTarget) {
		// @ts-ignore
		let date = inputObj.dataset.date;
		// @ts-ignore
		let content = inputObj.value;

		let tmp = Object.assign({}, contentData);
		// @ts-ignore
		tmp[date] = content;
		setContentData(tmp);
	}

	function handleImport(inputObj: HTMLInputElement) {
		if(!inputObj || !inputObj.files || inputObj.files.length < 1)
			return;

		let reader = new FileReader();
		reader.onload = async function () {
			let res = reader.result;
			if(!res || typeof res !== "string")
				return;
			let json = JSON.parse(res);
			if(!json.start || !json.end || !json.data)
				return;

			setStartDate(json.start);
			setEndDate(json.end);
			await updateTable();
			setContentData(json.data);
			updateTableContent();
		};
		// start reading the file. When it is done, calls the onload event defined above.
		reader.readAsBinaryString(inputObj.files[0]);
	}

	function handleOutput() {
		const element = document.createElement("a");
		let dataObj = {
			start: startDate,
			end: endDate,
			data: contentData
		};
		// @ts-ignore
		const textFile = new Blob([JSON.stringify(dataObj)], {type: 'text/plain'});
		element.href = URL.createObjectURL(textFile);
		element.download = `export-${_df(new Date())}.json"`;
		document.body.appendChild(element);
		element.click();
	}

	function _createTableRow(dateObj: Date, free:boolean, content: any) {
		const dow = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
		return (
			<tr className={free ? "free" : "work"}>
				<td>{`${_df(dateObj)} - ${dow[dateObj.getDay()]}`}</td>
				<td><input type="text" className="user-input" data-date={_df(dateObj)} defaultValue={content} onChange={evt => onContentChange(evt.target)}/></td>
			</tr>
		);
	}

	function _df(dt: Date) {
		return `${dt.getFullYear()}-${_pad(dt.getMonth() + 1)}-${_pad(dt.getDate())}`;
	}

	function _pad(num: number) {
		return `${num < 10 ? `0${num}` : num}`;
	}

	return (
		<div className="app">
			<div itemID="controls">
				<div className="flex m-2">
					<label className="mr-2">Start date: </label>
					<input type="date" value={startDate} onChange={evt => {setStartDate(evt.target.value)}}/>
				</div>
				<div className="flex m-2">
					<label className="mr-2">End date: </label>
					<input type="date" value={endDate} onChange={evt => {setEndDate(evt.target.value)}}/>
				</div>
				<div className="flex m-2">
					<label className="mr-2">Update table: </label>
					<button onClick={() => updateTable()}>Update</button>
				</div>
				<div className="flex m-2">
					<label className="mr-2">Import data: </label>
					<input type="file" accept="application/json" className="mr-2" onChange={evt => handleImport(evt.target)}/>
				</div>
				<div className="flex m-2">
					<label className="mr-2">Export data: </label>
					<button onClick={() => handleOutput()}>Export</button>
				</div>
			</div>
			<div itemID="data">
				<table className="m-2 mt-8 border border-1">
					<thead>
						<th className="minwid-24">Date</th>
						<th className="minwid-64">Information</th>
					</thead>
					<tbody>
						{tableContent}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default App;
