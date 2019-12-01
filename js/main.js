window.onload = function() {

	const CARD_FRONT = '../img/card-front.png';

	const imageApis = {
		cats: 'https://api.thecatapi.com/v1/images/search?size=full&limit=1',
		dogs: 'https://dog.ceo/api/breeds/image/random',
		moreDogs: 'https://random.dog/woof.json',
	}

	// JQuery elements objects
	const $blurDiv 					= $( '#blur-div' );
	const $pauseLink 		 		= $( '.pause-link' );
	const $cardGrid 				= $( '#card-grid' );
	const $gameMainContainer 		= $( '.game-main-container' );
	const $timeSpan 				= $( '.time > span' );
	const $modalMainWraper			= $( '.modal-wraper' );
	const $modalMainContainer 		= $( '.modal-main-container' );
	const $mainMenuButtons 			= $( '#main-menu .modal-buttons' );
	const $difficultyButtons 		= $( '#choose-difficulty .modal-buttons' );
	const $chooseThemeButtons 		= $( '#choose-theme .modal-buttons' );
	const $mainMenuModal 			= $( '#main-menu' );
	const $chooseDifficultyModal	= $( '#choose-difficulty' );
	const $chooseThemeModal 		= $( '#choose-theme' );
	const $winModal 				= $( '#win' );
	const $userScore				= $( '#user-score' );
	const $highestScore				= $( '#highest-score' );
	const $newGameBtn				= $( '#win #new-game' );

	let $cards;
	let $cardsImg;

	// Counters
	let clickedCardsSrc = [];
	let clickedCards 	= [];
	let goodAnswers 	= [];
	let attempts 		= 0;

	// Timer
	let timeInterval;
	let timerRunningFlag = true;

	// Local storage
	let gameData;
	let userScore;

	// ---------------------------------------------------------------------------------------------------------
	// Main

	function main() {
		// Check if local storage data already exists
		if (!window.localStorage.getItem('_gameData')) {
			gameData = {
				numOfCells: 12,
				urlApi: 'https://dog.ceo/api/breeds/image/random',
				themeFlag: 'dogs',
				difficultyFlag: 0, // Up to 3 (easy, medium, hard, custom)
			}
			window.localStorage.setItem('_gameData', JSON.stringify(gameData))
		} else {
			gameData = JSON.parse(window.localStorage.getItem('_gameData'));
		}

		userScore = {
			0: '99:99',
			1: '99:99',
			2: '99:99',
			3: '99:99',
		}

		!window.localStorage.getItem('userScore') && window.localStorage.setItem('userScore', JSON.stringify(userScore));

		createCardGrid(localGet('_gameData', 'numOfCells'), createCard, getImgUrls); // 12 18 24
		// Hide modal elements
		$chooseDifficultyModal.hide();
		$chooseThemeModal.hide();
		$winModal.hide();

		// Add modal buttons eventListeners
		$pauseLink.click(pauseLinkEventHandler);
		$mainMenuButtons.click(mainMenuBtnEventHandler);
		$difficultyButtons.click(difficultyBtnEventHandler);
		$chooseThemeButtons.click(chooseThemeBtnEventHandler);
		$newGameBtn.click(newGameBtnEventHandler);

		gameData  = JSON.parse(window.localStorage.getItem('_gameData'));
		userScore = JSON.parse(window.localStorage.getItem('userScore'));
	}

	// ------------------------------------------------------------------------------------------------------------
	// Event handler functions
	function pauseLinkEventHandler() {
		timerRunningFlag = false;
		$blurDiv.addClass('active');
		$modalMainWraper.slideDown();
	}

	function mainMenuBtnEventHandler(e) {
		switch (this.id) {
			case 'resume':
				timerRunningFlag = true;
				$blurDiv.removeClass('active')
				$modalMainWraper.slideUp();
				break;
			case 'new-game':
				window.location.reload();
				break;
			case 'change-difficulty':
				animateModal($mainMenuModal, $chooseDifficultyModal, 'forward')
				break;
			case 'change-theme': 
				animateModal($mainMenuModal, $chooseThemeModal, 'forward')
				break;
		}
	}

	function difficultyBtnEventHandler(e) {
		switch (this.id) {
			case 'easy':
				localPost('_gameData', gameData, 'difficultyFlag', 0);
				localPost('_gameData', gameData, 'numOfCells', '12');
				window.location.reload();
				break;
			case 'medium':
				localPost('_gameData', gameData, 'difficultyFlag', 1);
				localPost('_gameData', gameData, 'numOfCells', '18');
				window.location.reload();
				break;
			case 'hard':
				localPost('_gameData', gameData, 'difficultyFlag', 2);
				localPost('_gameData', gameData, 'numOfCells', '24');
				window.location.reload();
				break;
			case 'set-size':
				localPost('_gameData', gameData, 'difficultyFlag', 3);
				localPost('_gameData', gameData, 'numOfCells', getUserInput());
				window.location.reload();
				break;
			case 'back':
				animateModal($chooseDifficultyModal, $mainMenuModal, 'backward');
				break;
		}
	}

	function chooseThemeBtnEventHandler(e) {
		if (this.id !== 'back') {
			localPost('_gameData', gameData, 'urlApi', imageApis[this.id]);
			localPost('_gameData', gameData, 'themeFlag', this.id);
			$( this ).addClass('active');
			window.location.reload();
		 } else {
			animateModal($chooseThemeModal, $mainMenuModal, 'backward');
		}
	}

	function cardClickEventHandler(e) {

		// Get the src from other div and card el
		!timeInterval && startTimer();
		const src  = this.lastElementChild.firstElementChild.src;
		const card = e.target.parentElement.parentElement;

		clickedCardsSrc.push(src);
		clickedCards.push(card);

		$( card ).off('click');

		clickedCardsSrc.length < 3 && $( card ).flip(true);
		clickedCardsSrc.length == 2 && isMatch();
	}

	function newGameBtnEventHandler(){
		window.location.reload();
	}	

	// ------------------------------------------------------------------------------------------------------------
	// Game logic functions

	function isMatch() {
		const sameSrc = (clickedCardsSrc[0] == clickedCardsSrc[1])

		sameSrc ? weGotAmatch() : setTimeout(noMatch, 800);
	}

	function noMatch() {
		updateCounters();
		for (card of clickedCards) {
			$( card ).flip(false);
			$( card ).on('click', cardClickEventHandler);
		}
		clickedCards 	= [];
		clickedCardsSrc = [];
	}
	
	function weGotAmatch(){
		updateCounters()
		for (card of clickedCards) {
			$( card ).off(".flip");
			goodAnswers.push(card);
		}

		const temp 		= clickedCards;
		clickedCards 	= [];
		clickedCardsSrc = [];

		setTimeout(() => flashCards(temp), 500);


		if ( goodAnswers.length == localGet('_gameData', 'numOfCells') ) {
			clearInterval(timeInterval);
			winHandler();
		}
	}

	function winHandler() {
		const score 		 = $timeSpan.text();
		const difficultyFlag = localGet('_gameData', 'difficultyFlag');

		// if better time (format '00:00' 'mm:ss')
		console.log(localGet('userScore', difficultyFlag));

		if (score < localGet('userScore', difficultyFlag)) {
			localPost('userScore', userScore, difficultyFlag, score);
		} 
		setTimeout(showWinModal, 1125);
	}

	function showWinModal() {
		const difficultyFlag = localGet('_gameData', 'difficultyFlag');

		$mainMenuModal.hide();

		$blurDiv.addClass('active');
		$modalMainWraper.slideDown();
		$winModal.slideDown();

		$userScore.html($timeSpan.text());
		$highestScore.html(localGet('userScore', difficultyFlag));
	}

	// ------------------------------------------------------------------------------------------------------------
	// Cards functions

	async function createCardGrid(numOfCells, createCardFunc, getImgFunc) {
		let numOfImgToFetch = numOfCells / 2;

		let imgUrls = await getImgFunc(numOfImgToFetch, fetchImg);

		if (numOfCells == 12) {
			$cardGrid.css('max-width', '755px');
		} else {
			$cardGrid.css('max-width', '1000px');
		}
		for (let i = 0; i < numOfCells; i++) {
			$cardGrid.append( createCardFunc(CARD_FRONT, imgUrls[i] ) );
		}

		$cards = $( '.cards' );
		$cards.flip({
			trigger: 'manual',
		});

		$cards.click(cardClickEventHandler)
	}

	async function getImgUrls(numOfImgToFetch, fetchImgFunc) {
		$gameMainContainer.addClass('loading')

		const imgUrlCollection = [];
		for (let i = 0; i < numOfImgToFetch; i++) {
			let img = await fetchImgFunc();
			switch (localGet('_gameData', 'themeFlag')){
				case 'cats':
					imgUrlCollection.push(img[0].url);
					imgUrlCollection.push(img[0].url);
					break;
				case 'dogs':
					imgUrlCollection.push(img.message);
					imgUrlCollection.push(img.message);
					break;
				case 'moreDogs':
					imgUrlCollection.push(img.url);
					imgUrlCollection.push(img.url);
					break;
			}
		}
		$gameMainContainer.removeClass('loading');

		const shuffledUrls = shuffle(imgUrlCollection);
		
		return shuffledUrls;
	}

	function createCard(imgUrlFront, imgUrlBack) {
		return ( $(`
			<div class="cards">
				<div class="front">
					<img src="${imgUrlFront}">
				</div>
				<div class="back">
					<img src="${imgUrlBack}">
				</div>
			</div>
		`) );
	}

	function flashCards(arrayOfCards) {
		arrayOfCards.forEach(card => {
			$(card).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
			$(card).addClass('matched');
		});
	}

	// ------------------------------------------------------------------------------------------------------------
	// AJAX Call
	function handleFetchError(response) {
		$gameMainContainer.removeClass('loading');
		console.log('ERROR LOADING IMAGE');
		console.log(response);
		alert('We encoutered an issue downloading the data\nPlease try reloading the page');
	}

	async function fetchImg() {
		try {
			const dataPromise = await $.get({
				url: localGet('_gameData', 'urlApi'),
				dataType: 'JSON',
			});

			return dataPromise;

		} catch(response) {
			handleFetchError(response);
		}
	}
	
// ------------------------------------------------------------------------------------------------------------
// General purpose fuctions

	// --------------------------------------------------
	// Taken from https://javascript.info/task/shuffle
	function shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}
	// ---------------------------------------------------

	function startTimer() {
		ms = 0;
		timeInterval = setInterval(() => {
			if (timerRunningFlag){
				let date = new Date(0, 0, 0, 0, 0, 0, ms);
				$( '.time > span' ).html(date.toString().slice(19, 24));
				ms += 1000;
			}
		}, 1000);
	}

	function localGet(dataPoint, key) {
		return JSON.parse(window.localStorage.getItem(dataPoint))[key];
	}

	function localPost(dataPoint, dataVar, key, value) {
		dataVar[key] = value;
		window.localStorage.setItem(dataPoint, JSON.stringify(dataVar));
	}

	function getUserInput() {
		let userInput;

		while (isNaN(userInput)){
			userInput = parseInt(prompt('Please enter a (reasonable) number of cells for your grid: '));
		}
		return userInput;
	}

	function animateModal($modalOut, $modalIn, directionStr) {
		switch (directionStr) {	
			case 'forward':
				$modalOut.addClass('animated slideOutLeft');
				setTimeout(() => $modalOut.hide(), 300);
				setTimeout(() => $modalIn.show(), 400);
				$modalIn.addClass('animated slideInRight');
				break;
			case 'backward': {
				$modalOut.addClass('animated slideOutRight');
				setTimeout(() => $modalOut.hide(), 300);
				setTimeout(() => $modalIn.show(), 400);
				$modalIn.addClass('animated slideInLeft');
				break;
			}
		}
		setTimeout(() => {
			$modalOut[0].classList = 'modal-box';
			$modalIn[0].classList  = 'modal-box';
		}, 500);
	}

	function updateCounters() {
		clickCounter = 0;
		attempts++;
		$( '.click span' ).html(attempts);
	}
// ------------------------------------------------------------------------------------------------------------
	main();
}