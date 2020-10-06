// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

// ********************************************************************************************** \\

// helper functions
/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
	$('#jeopardy').remove();
	$('#loading').toggleClass('hidden');
	// make sure to remove event listener while it's loading
	$('#startGame').off('click', setupAndStart);
	$('#startGame').text('Loading...');
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
	$('#loading').toggleClass('hidden');
	$('#startGame').text('Restart Game');
	// re-add event listener so when done loading, game can be restarted
	$('#startGame').on('click', setupAndStart);
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
	showLoadingView();
	categories.length = 0;
	let randomIds = await getCategoryIds(6);
	for (let id of randomIds) {
		let catData = await getCategory(id);
		categories.push(catData);
	}
	console.log(categories);
	await fillTable(5);
	hideLoadingView();
}

// helper function to show questions in specified cell
function assignQ(row, col) {
	let $cell = $(`td[id="${row}${col}"]`);
	// console.log($cell);
	// console.log(categories[col - 1].clues);
	$cell.html(`<div class="shownQ m3-5">${categories[col - 1].clues[row - 1].question}</div>`);
}

// helper function to show answer in specified cell
function assignA(row, col) {
	let $cell = $(`td[id="${row}${col}"]`);
	// console.log($cell);
	// console.log(categories[col - 1].clues);
	$cell.addClass('answer');
	$cell.html(`${categories[col - 1].clues[row - 1].answer}`);
}

// ********************************************************************************************** \\

// HTTP request functions
//helper function to make html requests to API
async function makeRequest(endpoint, params) {
	let res = await axios.get(`https://jservice.io/api/${endpoint}`, params);
	// console.log(res.data);
	return res.data;
}

// RETRIEVE SPECIFIED NUMBER OF RANDOM AND UNIQUE CATEGORY IDS FROM MAX REQUEST SIZE OF 100 AND RETURN AN ARRAY OF THOSE IDS
async function getCategoryIds(num) {
	let paramObj = { params: { count: 100 } };
	let response = await makeRequest('categories', paramObj);
	const allIDs = [];
	for (let cat of response) {
		allIDs.push(cat.id);
	}
	const categoryIDs = _.sampleSize(allIDs, num);
	return categoryIDs;
}

// GET ALL INFO ABOUT A CATEGORY AND RETURN OBJECT WITH TITLE AND CLUES
async function getCategory(catId) {
	let getCluesParams = { params: { category: catId } };
	let getCategoryInfo = { params: { id: catId } };
	let clueInfo = await makeRequest('clues', getCluesParams);
	let categoryInfo = await makeRequest('category', getCategoryInfo);
	let clues = _.sampleSize(clueInfo, 5);
	let clueArr = [];

	for (let clue of clues) {
		let clueObj = {
			question : clue.question,
			answer   : clue.answer,
			showing  : null
		};
		clueArr.push(clueObj);
	}
	let categoryObject = {
		title : categoryInfo.title,
		clues : clueArr
	};
	return categoryObject;
}

// ********************************************************************************************** \\

// GAME BOARD FILLING-- I KNOW THIS COULD IN THEORY BE SPLIT INTO MULTIPLE FUNCTIONS FOR EACH SECTION OF THE TABLE, BUT I LIKE HAVING THIS ENTIRE CODE SNIPPET IN ONE SPOT
async function fillTable(numQuestions) {
	// ADD TABLE TO THE GAMESPACE AREA
	$('#gameSpace').append(
		'<table class="table table-dark bg-primary table-bordered" id="jeopardy"></table>'
	);

	// ADD TABLE HEAD AND BODY
	$('#jeopardy')
		.append('<thead id="categories"></thead>')
		.append('<tbody id="questions"></tbody>');

	// FILL TABLE HEAD WITH THE CATEGORY NAMES BASED ON HTTP REQUESTS
	for (let i = 0; i < categories.length; i++) {
		$('#categories').append(
			`<th scope="col" class="py-3 px-2 text-center align-middle" style="width: 100px" id="cat${i +
				1}">${categories[i].title}</th>`
		);
	}

	// ADD SPECIFIED NUMBER OF ROWS TO TABLE BODY, AND ADD ONE SPACE FOR EACH CATEGORY IN THAT ROW
	for (let i = 1; i <= numQuestions; i++) {
		$('#questions').append(`
            <tr class="questionRow text-center" id="row${i}">
                <td class="question qmark align-middle text-center pt-2 pb-4" id="${i}1"><i class="fas fa-question-circle fa-2x"></i></td>
                <td class="question qmark align-middle text-center pt-2 pb-4" id="${i}2"><i class="fas fa-question-circle fa-2x"></i></td>
                <td class="question qmark align-middle text-center pt-2 pb-4" id="${i}3"><i class="fas fa-question-circle fa-2x"></i></td>
                <td class="question qmark align-middle text-center pt-2 pb-4" id="${i}4"><i class="fas fa-question-circle fa-2x"></i></td>
                <td class="question qmark align-middle text-center pt-2 pb-4" id="${i}5"><i class="fas fa-question-circle fa-2x"></i></td>
                <td class="question qmark align-middle text-center pt-2 pb-4" id="${i}6"><i class="fas fa-question-circle fa-2x"></i></td>
            </tr>`);
	}
}

// ********************************************************************************************** \\

// EVENT LISTENERS
// TABLE CELL CLICK HANDLER TO DETERMINE WHAT IS DISPLAYED ON A CELL-BY-CELL BASIS
function handleClick(evt) {
	let cell = evt.target;
	// MAKE SURE THAT THE EVENT HANDLER IS USING THE CELL ITSELF (NOT WHAT'S INSIDE IT) AS THE TARGET
	if (cell.tagName !== 'TD') {
		cell = cell.parentNode;
	}
	// DEFINE ROW AND COL TO DETERMINE WHICH CATEGORY AND WHICH CLUE TO LOOK AT
	let row = cell.id[0];
	let col = cell.id[1];

	// ASSIGN QUESTION TO CELL AND DISPLAY IT
	if (categories[col - 1].clues[row - 1].showing === null) {
		categories[col - 1].clues[row - 1].showing = 'question';
		cell.classList.add('q');
		assignQ(row, col);

		// ASSIGN ANSWER TO CELL AND DISPLAY IT
	} else if (categories[col - 1].clues[row - 1].showing === 'question') {
		categories[col - 1].clues[row - 1].showing === 'answer';
		cell.classList.remove('q');
		cell.classList.add('a');
		assignA(row, col);
	}
}

//

/** On click of start / restart button, set up game. */
$('#startGame').on('click', setupAndStart);

/** On page load, add event handler for clicking clues */
$(document).on('click', '#jeopardy tbody tr td', handleClick);
