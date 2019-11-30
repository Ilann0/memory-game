// window.onload = function() {}

	const CARD_FRONT = '../img/card-front.png';

	const imageApis = {
		cats: 'https://api.thecatapi.com/v1/images/search?size=full&limit=1',
		dogs: 'https://dog.ceo/api/breeds/image/random',
		moreDogs: 'https://random.dog/woof.json',
	}

	const gifApi = 'api.giphy.com/v1/gifs/search';
	const gifApiKey = 'Pm10N9aUP7Z7GybXQ31xyJBGZ1hkeE6Y';

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

	let $cards;
	let $cardsImg;

	let clickedCardsSrc = [];
	let clickedCards 	= [];
	let goodAnswers 	= [];
	let attempts 		= 0;

	// Timer
	let timeInterval;
	let timerRunningFlag = true;

	// Set local storage
	let gameData;

	if (!window.localStorage.getItem('_gameData')) {
		gameData = {
			numOfCells: 12,
			urlApi: 'https://dog.ceo/api/breeds/image/random',
			themeFlag: 'dogs',
		}
		window.localStorage.setItem('_gameData', JSON.stringify(gameData))
	} else {
		gameData = JSON.parse(window.localStorage.getItem('_gameData'));
	}

	$chooseDifficultyModal.hide();
	$chooseThemeModal.hide();
	JSON.parse(localStorage.getItem('_gameData'))

	// Modal buttons eventListeners
	$pauseLink.click(pauseLinkEventHandler);
	$mainMenuButtons.click(mainMenuBtnEventHandler);
	$difficultyButtons.click(difficultyBtnEventHandler);
	$chooseThemeButtons.click(chooseThemeBtnEventHandler);

	function localGet(key) {
		return JSON.parse(window.localStorage.getItem('_gameData'))[key];
	}

	function localPost(key, value) {
		gameData[key] = value;
		window.localStorage.setItem('_gameData', JSON.stringify(gameData));
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

	function difficultyBtnEventHandler(e) {
		switch (this.id) {
			case 'easy':
				localPost('numOfCells', '12');
				window.location.reload();
				break;
			case 'medium':
				localPost('numOfCells', '18');
				window.location.reload();
				break;
			case 'hard':
				localPost('numOfCells', '24');
				window.location.reload();
				break;
			case 'set-size':
				localPost('numOfCells', getUserInput());
				window.location.reload();
				break;
			case 'back':
				animateModal($chooseDifficultyModal, $mainMenuModal, 'backward');
				break;
		}
	}

	function getUserInput() {
		let userInput;

		while (isNaN(userInput)){
			userInput = parseInt(prompt('Please enter a (reasonable) number of cells for your grid: '));
		}
		return userInput;
	}

	function chooseThemeBtnEventHandler(e) {
		if (this.id !== 'back') {
			localPost('urlApi', imageApis[this.id]);
			localPost('themeFlag', this.id);
			$( this ).addClass('active');
			window.location.reload();
		 } else {
			animateModal($chooseThemeModal, $mainMenuModal, 'backward');
		}
	}	

	function cardClickEventHandler(e) {

		// Get the src from other div and card el
		!timeInterval && startTimer();
		const src = this.lastElementChild.firstElementChild.src;
		const card = e.target.parentElement.parentElement

		clickedCardsSrc.push(src);
		clickedCards.push(card);

		$( card ).off('click');

		clickedCardsSrc.length < 3 && $( card ).flip(true);
		clickedCardsSrc.length == 2 && isMatch();
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
			$modalIn[0].classList = 'modal-box';
		}, 500);
	}

	function pauseLinkEventHandler() {
		$blurDiv.addClass('active');
		$modalMainWraper.slideDown();
	}

	function updateCounters() {
		clickCounter = 0;
		attempts++;
		$( '.click span' ).html(attempts);
	}

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
		clickedCards = [];
		clickedCardsSrc = [];
	}

	function weGotAmatch(){
		updateCounters()
		for (card of clickedCards) {
			$( card ).off(".flip");
			goodAnswers.push(card);
		}

		const temp = clickedCards
		clickedCards = [];
		clickedCardsSrc = [];

		setTimeout(() => flashCards(temp), 500);


		if ( goodAnswers.length == localGet('numOfCells') ) {
			clearInterval(timeInterval);
			displayStandardModal();

		}
	}

	function flashCards(arrayOfCards) {
		arrayOfCards.forEach(card => {
			$(card).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
			$(card).addClass('matched');
		});
	}

	// function compareCard()

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

	// setCardSrc()

	createCardGrid(localGet('numOfCells'), createCard, getImgUrls); // 12 18 24


	function handleFetchError(response) {
		$gameMainContainer.removeClass('loading');
		console.log('ERROR LOADING IMAGES');
		console.log(response);
		alert('We encoutered an issue downloading the data\nPlease try reloading the page');
	}


	// Get all the urls
	async function getImgUrls(numOfImgToFetch, fetchImgFunc) {
		$gameMainContainer.addClass('loading')

		const imgUrlCollection = [];
		for (let i = 0; i < numOfImgToFetch; i++) {
			let img = await fetchImgFunc();
			switch (localGet('themeFlag')){
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


	// Ajax get request
	async function fetchImg() {
		try {
			const dataPromise = await $.get({
				url: localGet('urlApi'),
				dataType: 'JSON',
			});

			return dataPromise;

		} catch(response) {
			// statements
			handleFetchError(response);
		}
	}
	
	// ------------------------------------------------------------------------------------
	// General purpose fuctions


	// Taken from https://javascript.info/task/shuffle
	function shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

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

	// ---------------------------------------------------------------------------------------
	// Buttons




// ---------------------------------------------------------------------
// PSEUDO

/*
get img from server
create card
add image to card
dom.append(card grid)
listen for clicks
count clicks --> after two clicks pause
timeout on 2nd click's function to pause
in that function 
	compare the two cards
if match -> keep images fliped

///////////////////
if game finish show modal with score personal high score, global high score, start new game
starting menu


*/