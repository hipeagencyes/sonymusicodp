(function ($) {

'use strict';



window.$document = $(document);
window.$pageWrapper = $('.page-wrapper');
window.$pageHeader = $('.header__wrapper-overlay-menu');
window.$barbaWrapper = $('[data-barba="wrapper"]');
window.$body = $('body');
window.$wrapperBackgrounds = $('.project-backgrounds');
window.$backgroundsOverlay = $('.project-backgrounds__overlay');
window.$overlay = $('.header__wrapper-overlay-menu');
window.$backgrounds = $('.project-backgrounds__background');
function renderSliderCounter() {}
function debounce(fn) { return fn; }
function ProjectBackgrounds() {}
function SliderBackgrounds() {}
function restoreScrollTop() {}

window.$burger = $('#js-burger');
window.$header = $('.header');

/**
 * Try to use high performance GPU on dual-GPU systems
 */
runOnHighPerformanceGPU();

/**
 * Default Theme Options
 * Used to prevent errors if there is
 * no data provided from backend
 */

if (typeof window.theme === 'undefined') {
	window.theme = {
		typography: {
			fontPrimary: 'Helvetica Neue Thin',
			fontSecondary:'Helvetica Neue Thin',
		},
		smoothScroll: {
			damping: 0.08,
			renderByPixels: true,
			continuousScrolling: false,
			plugins: {
				edgeEasing: true
			}
		}
	};
}

/**
 * ScrollMagic Setup
 */
window.SMController = new ScrollMagic.Controller();
window.SMController.enabled(false);
window.SMSceneTriggerHook = 0.8;
window.SMSceneReverse = false;

/**
 * Theme Fonts
 */
window.fontPrimaryObserver = new FontFaceObserver(window.theme.typography.fontPrimary);
window.fontSecondaryObserver = new FontFaceObserver(window.theme.typography.fontSecondary);



$document.ready(function () {

    // Ya NO usamos Preloader().then(...)
    // Simplemente inicializamos todo directamente

    Promise
        .all([window.fontPrimaryObserver.load(), window.fontSecondaryObserver.load()])
        .then(() => doSplitText($document))
        .then(() => setLines($document))
        .then(function () {
            window.SMController.enabled(true);
            window.SMController.update(true);
            initComponents($document);
        });

    new PJAX();
    new ProjectBackgrounds();
   

});

function initComponents($scope = $document) {

	new SmoothScroll();

	window.PageHeader = new Header();
	if (typeof window.PageMenu === 'undefined') {
		window.PageMenu = new MenuOverlay();
	}

	lazyLoad($scope);
	new SliderImages($scope);
	new SectionContent($scope);
	new SectionTextSlider($scope);
	new SectionHeadingsSlider($scope);
	$('.js-video').magnificPopup();
	fixMobileBarHeight();

}

/*!========================================================================
	1. PJAX Animate Clonned Image
	======================================================================!*/
function PJAXAnimateClonnedImage(data, $customPositionElement) {

	return new Promise(function (resolve, reject) {
		var
			tl = new TimelineMax(),
			$trigger = $(data.trigger),
			$postId = $trigger.data('post-id'),
			$targetBackground = window.$backgrounds.filter('[data-background-for=' + $postId + ']'),
			$img = $customPositionElement ? $customPositionElement : $trigger.find('img[src]');

		if (!$img.length) {
			resolve(true);
		}

		var
			$clone = $img.clone(),
			imgPosition = $img.get(0).getBoundingClientRect();

		tl.timeScale(1.25);

		tl
			.set($clone, {
				position: 'fixed',
				top: imgPosition.top,
				left: imgPosition.left,
				width: imgPosition.width,
				height: imgPosition.height,
				className: '+=of-cover',
				zIndex: 300
			})
			.add(function () {
				$targetBackground.addClass('selected');
				$clone.appendTo(window.$body);
			})
			.set(window.$backgroundsOverlay, {
				autoAlpha: 0
			})
			.to($clone, 0.6, {
				transition: 'none',
				transform: 'none',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				 ease: Power2.easeOut // Más rápido y directo
			})
			.set(window.$wrapperBackgrounds, {
				backgroundColor: 'transparent',
				scaleX: 1,
				zIndex: 400,
				autoAlpha: 1
			})
			.add(function () {

				scrollToVeryTop();
				setTimeout(function () {
					$clone.remove();
					resolve(true);
				}, 100);

			});

	});

}

/*!========================================================================
	2. PJAX Animate Masthead
	======================================================================!*/
function PJAXAnimateMasthead(data) {

	return new Promise(function (resolve, reject) {

		var
			$nextContainer = $(data.next.container),
			$nextMasthead = $nextContainer.find('.section-masthead').first(),
			$nextBgWrapper = $nextMasthead.find('.section-masthead__background'),
			tl = new TimelineMax(),
			$selectedBackground = window.$backgrounds.filter('.selected');

		if (!$selectedBackground.length || !$nextBgWrapper.length) {
			resolve(true);
		}

		var
			$nextBg = $nextBgWrapper.find('.art-parallax__bg'),
			$nextOverlay = $nextMasthead.find('.section-masthead__overlay'),
			nextBgWrapperPosition = $nextBgWrapper.get(0).getBoundingClientRect(),
			transformMatrix = $nextBg.css('transform');

		tl.timeScale(1.25);
		scrollToVeryTop();

		if ($nextOverlay.length) {

			tl.to(window.$backgroundsOverlay, 0.6, {
				autoAlpha: 0.6,
				ease: Expo.easeInOut
			}, '0');

		} else {

			tl.set(window.$backgroundsOverlay, {
				autoAlpha: 0
			}, '0');

		}

		tl.add([
				TweenMax.to(window.$wrapperBackgrounds, 1.2, {
					top: nextBgWrapperPosition.top,
					left: nextBgWrapperPosition.left,
					width: nextBgWrapperPosition.width,
					height: nextBgWrapperPosition.height,
					ease: Expo.easeInOut,
				}),
				TweenMax.to($selectedBackground, 1.2, {
					transition: 'none',
					transform: transformMatrix,
					ease: Expo.easeInOut,
				})
			], '0')
			.set(window.$wrapperBackgrounds, {
				autoAlpha: 0
			})
			.add(function () {
				resolve(true);
			});

	});

}

/*!========================================================================
	3. PJAX Finish Loading
	======================================================================!*/
function PJAXFinishLoading(data) {

	return new Promise(function (resolve, reject) {

		window.SMController.enabled(true);
		window.SMController.update(true);
		window.$backgrounds.removeClass('selected active');
		window.$header.removeClass('header_lock-submenus');
		window.InteractiveCursor.finishLoading();

		lockScroll(false);

		TweenMax.to(window.$spinner, 1.2, {
			autoAlpha: 0
		});


		TweenMax.set(window.$wrapperBackgrounds, {
			autoAlpha: 0,
			zIndex: -1,
			clearProps: 'width,height,left,right,top,bottom,backgroundColor',
		});

		TweenMax.set(window.$backgroundsOverlay, {
			autoAlpha: 1
		});

		TweenMax.set(window.$backgrounds, {
			transition: '',
			clearProps: 'transform,width,height',
		});

		setTimeout(function () {
			window.$overlay.removeClass('intransition lockhover opened');
		}, 300);

		resolve(true);

	});

}

/*!========================================================================
	4. PJAX Init New Page
	======================================================================!*/
function PJAXInitNewPage(data) {

	return new Promise(function (resolve, reject) {

		var
			tl = new TimelineMax(),
			$nextContainer = $(data.next.container);

		tl
			.add(function () {

				// clear & re-init ScrollMagic
				window.SMController.destroy(true);
				window.SMController = new ScrollMagic.Controller();

				// split text lines in new container
				doSplitText($nextContainer).then(setLines($nextContainer)).then(function () {

					// scroll to the top
					setTimeout(function () {
						scrollToVeryTop();
					}, 100);

					// re-init components
					initComponents($nextContainer);
					window.SMController.enabled(false);

					// update ad trackers
					PJAXUpdateTrackers();

				});

				// change header color if needed
				switch (data.next.namespace) {
					case 'light': {
						window.$header.removeClass('header_white').addClass('header_black');
						break;
					}
					case 'dark': {
						window.$header.removeClass('header_black').addClass('header_white');
						break;
					}
				}

			})
			.add(function () {
				resolve(true);
			});

	});

}

/*!========================================================================
	5. PJAX Prepare Transition
	======================================================================!*/
function PJAXPrepareTransition(data) {

	return new Promise(function (resolve, reject) {

		var $trigger = $(data.trigger);

		window.InteractiveCursor.drawLoading();
		window.$overlay.addClass('intransition lockhover');
		$trigger.addClass('selected');

		TweenMax.set(window.$curtains, {
			scaleX: 0,
			transformOrigin: 'left center'
		});


		if (window.$spinner.length) {
			TweenMax.to(window.$spinner, 0.6, {
				autoAlpha: 1
			});
		}

		resolve(true);

	});

}

/*!========================================================================
	6. PJAX Transition Fullscreen Slider
	======================================================================!*/
var PJAXTransitionFullscreenSlider = {
	name: 'fullscreenSlider',
	custom: ({
		current,
		next,
		trigger
	}) => {
		return $(trigger).data('pjax-link') == 'fullscreenSlider';
	},
	before: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXPrepareTransition(data).then(function () {
				resolve(true);
			});

		});

	},
	beforeLeave: (data) => {

		return new Promise(function (resolve, reject) {

			var
				tl = new TimelineMax(),
				$target = $('.section-fullscreen-slider'),
				$backgroundOverlay = $target.find('.slider__background-overlay');

			tl
				.set(window.$wrapperBackgrounds, {
					zIndex: -1,
					scaleX: 1,
					autoAlpha: 1,
					backgroundColor: 'transparent',
				})
				.set(window.$backgroundsOverlay, {
					autoAlpha: 0
				})
				.to($backgroundOverlay, 1.2, {
					autoAlpha: 0,
					ease: Expo.easeInOut
				}, '0.6')
				.to($target, 1.2, {
					autoAlpha: 0,
					ease: Expo.easeInOut
				}, '0')
				.to(window.$wrapperBackgrounds, 1.2, {
					autoAlpha: 1,
					zIndex: 400,
					ease: Expo.easeInOut
				}, '0.6')
				.add(function () {
					resolve(true);
				});

		});

	},
	enter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXInitNewPage(data).then(function () {
				resolve(true)
			});

		});

	},
	afterEnter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXAnimateMasthead(data).then(function () {
				resolve(true);
			});

		});

	},
	after: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXFinishLoading(data).then(function () {
				resolve(true);
			});

		});

	}
}

/*!========================================================================
	7. PJAX Transition General
	======================================================================!*/
var PJAXTransitionGeneral = {

	before() {
		window.InteractiveCursor.drawLoading();
	},

	beforeLeave: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXPrepareTransition(data).then(function () {
				resolve(true)
			});

		});

	},

	leave: (data) => {

		return new Promise(function (resolve, reject) {

			var
				tl = new TimelineMax(),
				$currentContainer = $(data.current.container);

			tl.timeScale(1.5);

			if (!$overlay.hasClass('opened')) {

				tl.to($currentContainer, 1.2, {
					x: '10vw',
					force3D: true,
					transformOrigin: 'left center',
					ease: Expo.easeInOut
				});

				tl
					.to($curtains, 0.6, {
						scaleX: 1,
						transformOrigin: 'left center',
						ease: Expo.easeInOut
					}, '0.2');

			}

			tl
				.add(function () {
					window.$header.removeClass('header_black').addClass('header_white');
				}, '0')
				.add(function () {
					$currentContainer.remove();
					resolve(true);
				});

		});

	},

	enter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXInitNewPage(data).then(function () {
				resolve(true)
			});

		});

	},

	afterEnter: (data) => {

		return new Promise(function (resolve, reject) {

			var
				tl = new TimelineMax(),
				$nextContainer = $(data.next.container),
				$nextMasthead = $nextContainer.find('.section-masthead').first(),
				$nextBg = $nextMasthead.find('.section-masthead__background .art-parallax__bg');

			tl
				.set($burger, {
					className: '-=header__burger_opened'
				})
				.set($nextContainer, {
					autoAlpha: 1,
					x: '-5vw',
					force3D: true,
					transformOrigin: 'right center',
				});

			// animate (close) header if it's opened
			if (window.$pageHeader.hasClass('opened')) {

				var tlClose = $nextBg.length ? window.PageHeader.hideOverlayMenu(false) : window.PageHeader.hideOverlayMenu(true);

				tl
					.add(tlClose, '0')
					.set(window.$overlay, {
						className: '+=intransition'
					})
					.to($nextContainer, 1.2, {
						x: '0vw',
						force3D: true,
						ease: Expo.easeInOut
					});

			} else {

				tl
					.to($nextContainer, 1.2, {
						x: '0vw',
						force3D: true,
						ease: Expo.easeInOut
					})
					.to(window.$curtains, 0.6, {
						scaleX: 0,
						transformOrigin: 'right center',
						ease: Expo.easeInOut
					}, '0.3');

			}

			tl
				.set(window.$overlay, {
					className: '+=intransition'
				})
				.add(function () {
					resolve(true);
				}, '-=0.3');


		});

	},

	after: (data) => {

		return new Promise(function (resolve, reject) {
			PJAXFinishLoading(data).then(function () {
				resolve(true);
			});

		});

	}

}

/*!========================================================================
	8. PJAX Transition Halfscreen Slider
	======================================================================!*/
var PJAXTransitionHalfscreenSlider = {
	name: 'halfscreenSlider',
	custom: ({
		current,
		next,
		trigger
	}) => {
		return $(trigger).data('pjax-link') == 'halfscreenSlider';
	},
	before: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXPrepareTransition(data).then(function () {
				resolve(true);
			});

		});

	},
	beforeLeave: (data) => {

		return new Promise(function (resolve, reject) {

			var
				tl = new TimelineMax(),
				$sliderContent = $('.slider-halfscreen__content'),
				$wrapperImg = $('.slider-halfscreen__images-slide.swiper-slide-active .slider-halfscreen__images-slide-inner'),
				$mobileOverlay = $('.slider-halfscreen__overlay'),
				$customPositionElement = $('.slider-halfscreen__images-slide.swiper-slide-active .slider-halfscreen__bg');

			tl
				.to($wrapperImg, 0.6, {
					scale: 1
				})
				.to($sliderContent, 1.2, {
					x: '10vw',
					autoAlpha: 0,
					ease: Expo.easeInOut
				}, '0.6')
				.to($mobileOverlay, 0.6, {
					autoAlpha: 0
				}, '0')
				.set(window.$wrapperBackgrounds, {
					zIndex: 400,
					scaleX: 1,
					autoAlpha: 1,
					backgroundColor: 'transparent',
				})
				.set(window.$backgroundsOverlay, {
					autoAlpha: 0
				})
				.add(function () {
					PJAXAnimateClonnedImage(data, $customPositionElement).then(function () {
						resolve(true);
					});
				}, '0.6');

		});

	},
	enter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXInitNewPage(data).then(function () {
				resolve(true)
			});

		});

	},
	afterEnter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXAnimateMasthead(data).then(function () {
				resolve(true);
			});

		});

	},
	after: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXFinishLoading(data).then(function () {
				resolve(true);
			});

		});

	}
}

/*!========================================================================
	9. PJAX Transition Masonry Grid
	======================================================================!*/
var PJAXTransitionMasonryGrid = {
	name: 'masonryGrid',
	custom: ({
		current,
		next,
		trigger
	}) => {
		return $(trigger).data('pjax-link') == 'masonryGrid';
	},
	before: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXPrepareTransition(data).then(function () {
				resolve(true);
			});

		});

	},
	beforeLeave: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXAnimateClonnedImage(data).then(function () {
				resolve(true)
			});

		});

	},
	enter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXInitNewPage(data).then(function () {
				resolve(true)
			});

		});

	},
	afterEnter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXAnimateMasthead(data).then(function () {
				resolve(true);
			});

		});

	},
	after: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXFinishLoading(data).then(function () {
				resolve(true);
			});

		});

	}
}

/*!========================================================================
	10. PJAX Transition Nav Projects
	======================================================================!*/
var PJAXTransitionNavProjects = {
	name: 'navProjects',
	custom: ({
		current,
		next,
		trigger
	}) => {
		return $(trigger).data('pjax-link') == 'navProjects';
	},
	before: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXPrepareTransition(data).then(function () {
				resolve(true);
			});

		});

	},
	beforeLeave: (data) => {

		return new Promise(function (resolve, reject) {

			var
				tl = new TimelineMax(),
				$customPositionElement = $('.section-nav-projects__backgrounds'),
				$inner = $('.section-nav-projects__inner'),
				$backgroundOverlay = $('.section-nav-projects__overlay');

			tl
				.to($inner, 0.3, {
					transition: 'none',
					autoAlpha: 0,
					ease: Expo.easeInOut,
				}, '0')
				.to($backgroundOverlay, 0.3, {
					transition: 'none',
					autoAlpha: 0,
					ease: Expo.easeInOut,
				}, '0')
				.add(function () {
					PJAXAnimateClonnedImage(data, $customPositionElement).then(function () {
						resolve(true);
					});
				});

		});

	},
	enter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXInitNewPage(data).then(function () {
				resolve(true)
			});

		});

	},
	afterEnter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXAnimateMasthead(data).then(function () {
				resolve(true);
			});

		});

	},
	after: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXFinishLoading(data).then(function () {
				resolve(true);
			});

		});

	}
}

/*!========================================================================
	11. PJAX Transition Overlay Menu
	======================================================================!*/
var PJAXTransitionOverlayMenu = {
	name: 'overlayMenu',
	custom: ({
		current,
		next,
		trigger
	}) => {
		return $(trigger).data('pjax-link') == 'overlayMenu';
	},

	before: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXPrepareTransition(data).then(function () {
				lockScroll(false);
				resolve(true);
			});

		});

	},

	enter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXInitNewPage(data).then(function () {

				var
					tl = new TimelineMax(),
					$nextContainer = $(data.next.container),
					$nextMasthead = $nextContainer.find('.section-masthead').first(),
					$nextBg = $nextMasthead.find('.section-masthead__background .art-parallax__bg'),
					tlClose = $nextBg.length ? window.PageHeader.hideOverlayMenu(false) : window.PageHeader.hideOverlayMenu(true),
					$nextOverlay = $nextMasthead.find('.section-masthead__overlay');

				if ($nextBg.length) {

					if ($nextOverlay.length) {

						tl.to(window.$backgroundsOverlay, 1.2, {
							autoAlpha: 0.6,
							transition: 'none',
							ease: Expo.easeInOut,
						});

					} else {

						tl.to(window.$backgroundsOverlay, 1.2, {
							autoAlpha: 0,
							transition: 'none',
							ease: Expo.easeInOut,
						});

					}

				}

				tl
					.add(tlClose, '0')
					// .add(function () {
					// 	lockScroll(false);
					// }, '0.4')
					.to($nextContainer, 1.2, {
						x: '0vw',
						force3D: true,
						ease: Expo.easeInOut
					}, '0.4')
					
					.set(window.$overlay, {
						className: '+=intransition'
					})
					.set(window.$wrapperBackgrounds, {
						backgroundColor: 'transparent'
					})
					.add(function () {
						resolve(true);
					});

			});

		});

	},

	afterEnter: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXAnimateMasthead(data).then(function () {
				resolve(true);
			});

		});

	},
	after: (data) => {

		return new Promise(function (resolve, reject) {

			PJAXFinishLoading(data).then(function () {
				resolve(true);
			});

		});

	}
}

/*!========================================================================
	12. PJAX Update Trackers
	======================================================================!*/
function PJAXUpdateTrackers() {

	updateGA();
	updateFBPixel();
	updateYaMetrika();

	/**
	 * Google Analytics
	 */
	function updateGA() {

		if (typeof gtag === 'function') {

			if (window.gaData && Object.keys(window.gaData)[0] !== 'undefined') {

				var
					trackingID = Object.keys(window.gaData)[0],
					pageRelativePath = (window.location.href).replace(location.origin, '');

				gtag('js', new Date());
				gtag('config', trackingID, {
					'page_title': document.title,
					'page_path': pageRelativePath
				});

			}

		}

	}

	/**
	 * Facebook Pixel
	 */
	function updateFBPixel() {

		if (typeof fbq === 'function') {
			fbq('track', 'PageView');
		}

	}

	/**
	 * Yandex Metrika
	 */
	function updateYaMetrika() {

		if (typeof ym === 'function') {

			var trackingID = getYmTrackingNumber();

			ym(trackingID, 'hit', window.location.href, {
				title: document.title
			});

		}

		function getYmTrackingNumber() {

			if (typeof window.Ya !== 'undefined' && typeof window.Ya.Metrika2) {
				return window.Ya.Metrika2.counters()[0].id || null;
			}

			if (typeof window.Ya !== 'undefined' && typeof window.Ya.Metrika) {
				return window.Ya.Metrika.counters()[0].id || null;
			}

			return null;

		}

	}

}

/*!========================================================================
	13. PJAX
	======================================================================!*/
var PJAX = function () {

	var $barbaWrapper = $('[data-barba="wrapper"]');

	if (!$barbaWrapper.length) {
		return;
	}

	barba.init({

		transitions: [
			PJAXTransitionGeneral,
			PJAXTransitionMasonryGrid,
			PJAXTransitionFullscreenSlider,
			PJAXTransitionHalfscreenSlider,
			PJAXTransitionOverlayMenu,
			PJAXTransitionNavProjects,
		]

	});


}


/*!========================================================================
	22. Header
	======================================================================!*/
var Header = function () {

	var $overlay = $('.header__wrapper-overlay-menu');

	if (!$overlay.length) {
		return;
	}

	var
		tl = new TimelineMax(),
		$menuLinks = $overlay.find('.menu-overlay > li > a'),
		$allLinks = $overlay.find('a'),
		$submenu = $overlay.find('.menu-overlay .sub-menu'),
		$submenuButton = $('#js-submenu-back'),
		$submenuLinks = $submenu.find('> li > a'),
		$overlayWidgets = $overlay.find('.header__wrapper-overlay-widgets'),
		$widgets = $overlay.find('.figure-property'),
		$headerLeft = $('.header__col-left'),
		OPEN_CLASS = 'header__burger_opened';

	clickBurger();
	prepare();
	setOverlayMenu();

	function prepare() {

		TweenMax.set($menuLinks.find('.split-chars__char'), {
			x: '-100px',
			autoAlpha: 0
		});

		TweenMax.set($submenuLinks.find('.split-chars__char'), {
			x: '-30px',
			autoAlpha: 0
		});

	}

	function setOverlayMenu() {

		getScrollTop();
		window.$overlay.removeClass('intransition lockhover opened has-opened-submenu');
		$submenu.removeClass('opened');
		$allLinks.removeClass('selected');

		TweenMax.set(window.$overlay, {
			scaleX: 0,
			autoAlpha: 0,
		});

		TweenMax.set([$submenu, $submenuButton], {
			autoAlpha: 0
		});

		TweenMax.set($overlayWidgets, {
			scaleY: 0,
			transformOrigin: 'bottom center',
		});

		TweenMax.set(window.$wrapperBackgrounds, {
			clearProps: 'width,height,left,right,top,bottom,backgroundColor',
		});

		setLines($widgets);

	}

	function closeOverlayMenu(hideBackgrounds) {

		var
			$submenuLinksCurrent = $submenu.filter('.opened').find($submenuLinks),
			$pageWrapper = $('.page-wrapper'),
			$layers = [];

		$layers.push(window.$overlay);

		if (hideBackgrounds == true) {
			$layers.push(window.$wrapperBackgrounds);
		}

		tl.timeScale(1.5);

		return tl
			.clear()
			.add([
				TweenMax.set(window.$overlay, {
					className: '+=intransition',
					transformOrigin: 'right center',
					zIndex: 500
				}),
				TweenMax.set(window.$wrapperBackgrounds, {
					transformOrigin: 'right center',
					zIndex: 100,
				}),
				TweenMax.set($burger, {
					className: '-=header__burger_opened'
				}),
				TweenMax.set($pageWrapper, {
					clearProps: 'overflow,height',
					x: '-5vw',
					force3D: true,
					transformOrigin: 'right center',
				}),
				function () {
					restoreScrollTop();
				}
			])
			.add([
				hideWords($menuLinks, 1.2, 0.01, '100px', true, 'start'),
				hideWords($submenuLinksCurrent, 1.2, 0.01, '30px', true, 'start'),
				hideLines($widgets, 0.6),
			], '0.3')
			.to($overlayWidgets, 0.6, {
				scaleY: 0,
				transformOrigin: 'top center',
				ease: Expo.easeInOut
			}, '1')
			.to($layers, 1.2, {
				scaleX: 0,
				ease: Expo.easeInOut
			}, '1')
			.fromTo($pageWrapper, 2.4, {
				autoAlpha: 1,
			}, {
				x: '0vw',
				force3D: true,
				autoAlpha: 1,
				ease: Expo.easeInOut,
			}, '0.3')
			.to($submenuButton, 0.6, {
				x: '-10px',
				autoAlpha: 0
			}, '0.3')
			.fromTo($headerLeft, 2.4, {
				x: '-50px',
			}, {
				x: '0px',
				autoAlpha: 1,
				ease: Expo.easeInOut
			}, '0.3')
			.add(function () {
    setOverlayMenu();
    prepare();
    // Añade esto:
    document.dispatchEvent(new Event('overlayMenuClosed'));
});
	};

	function openOverlayMenu() {

		var $pageWrapper = $('.page-wrapper');

		tl.timeScale(1);

		tl
			.clear()
			.add(function () {
				getScrollTop();
				window.$overlay.addClass('intransition opened');
			})
			.set(window.$overlay, {
				autoAlpha: 1,
				transformOrigin: 'left center',
				zIndex: 500
			})
			.set(window.$wrapperBackgrounds, {
				scaleX: 0,
				transformOrigin: 'left center',
				autoAlpha: 1,
				zIndex: 100,
			})
			.set(window.$backgroundsOverlay, {
				autoAlpha: 0.6
			})
			.to($pageWrapper, 1.2, {
				x: '10vw',
				force3D: true,
				transformOrigin: 'left center',
				ease: Expo.easeInOut,
				onComplete: function () {
					TweenMax.set($pageWrapper, {
						autoAlpha: 0
					});
				}
			})
			.to($headerLeft, 1.2, {
				x: '50px',
				autoAlpha: 0,
				ease: Expo.easeInOut
			}, '0')
			.to([window.$overlay, window.$wrapperBackgrounds], 0.6, {
				scaleX: 1,
				ease: Expo.easeInOut
			}, '0.2')
			.add(animateWords($menuLinks, 0.4, 0.01, true, false, '-=1.5'), '0.6')
			.to($overlayWidgets, 1.2, {
				scaleY: 1,
				ease: Expo.easeInOut,
			}, '0.4')
			.add(animateLines($widgets), '0.4')
			.add(function () {
				window.$overlay.removeClass('intransition');
			}, '0.9');
	};

	function clickBurger() {

		window.$burger.off().on('click', function (e) {

			e.preventDefault();

			if (!$overlay.hasClass('intransition')) {

				if (window.$burger.hasClass(OPEN_CLASS)) {
					closeOverlayMenu(true);
					window.$burger.removeClass(OPEN_CLASS);
				} else {
					openOverlayMenu();
					window.$burger.addClass(OPEN_CLASS);
				}

			}

		});

	}

	this.hideOverlayMenu = function (hideBackgrounds) {

		return closeOverlayMenu(hideBackgrounds);

	}

}

/*!========================================================================
	23. Lazy Load
	======================================================================!*/
function lazyLoad($scope = document, $elements = $document.find('.lazy')) {

	var $images = $elements.find('img[data-src]');
	var $backgrounds = $scope.find('.lazy-bg[data-src]');

	setResponsivePaddingBottom($images).then(loadImages());

	function setResponsivePaddingBottom($images) {

		return new Promise(function (resolve, reject) {

			$images.each(function () {

				var
					$el = $(this),
					elWidth = $el.attr('width'),
					elHeight = $el.attr('height');

				// we need both width and height of element
				// to calculate proper value for "padding-bottom" hack
				if (!elWidth || !elHeight) {
					return;
				}

				var elPB = (elHeight / elWidth) * 100 + '%';

				$el.removeAttr('width').removeAttr('height').removeAttr('src');

				$el.parent().css({
					'padding-bottom': elPB,
					'animation-name': 'loading',
					'width': '100%',
					'height': '0'
				});

			});

			resolve();

		});

	};

	function loadImages() {

		return new Promise(function (resolve, reject) {

			var instance = $images.Lazy({
				chainable: false,
				afterLoad: function (el) {

					$(el).parent().css({
						'padding-bottom': '',
						'width': '',
						'height': '',
						'animation-name': 'none',
						'background-color': 'initial'
					});

					setTimeout(function () {
			
					}, 300);

				}

			});

			var instanceBackgrounds = $backgrounds.Lazy({
				chainable: false
			});

			// update lazy load instance when smooth scroll is enabled
			if (window.SB !== undefined && instance.config && instance.config('delay') !== 0) {

				window.SB.addListener(function () {
					instance.update(true);
					instanceBackgrounds.update(true);
				});

			}

			resolve(true);

		});
	};

}

/*!========================================================================
	24. Menu Overlay
	======================================================================!*/
var MenuOverlay = function () {

	var $menu = $('.js-menu-overlay');

	if (!$menu.length) {
		return;
	}

	var
		$overlay = $('.header__wrapper-overlay-menu'),
		$widgets = $overlay.find('.figure-property'),
		$links = $menu.find('.menu-item-has-children > a'),
		$allLinks = $menu.find('a'),
		$submenus = $menu.find('.sub-menu'),
		$submenuButton = $('#js-submenu-back'),
		OPEN_CLASS = 'opened',
		SELECTED_CLASS = 'selected',
		HOVER_CLASS = 'menu-overlay_hover',
		tl = new TimelineMax();

	function openSubmenu($submenu, $currentMenu) {

		var
			$currentLinks = $currentMenu.find('> li > a .menu-overlay__item-wrapper'),
			$submenuLinks = $submenu.find('> li > a .menu-overlay__item-wrapper');

		tl
			.clear()
			.add([
				TweenMax.set($submenu, {
					autoAlpha: 1
				}),
				function () {

					$overlay.addClass('intransition lockhover');
					$submenus.removeClass(OPEN_CLASS);
					$submenu.not($menu).addClass(OPEN_CLASS);

					if (Modernizr.mq('(max-width: 991px)')) {
						if ($submenus.hasClass(OPEN_CLASS)) {
							hideLines($widgets, 0.6);
						} else {
							animateLines($widgets);
						}
					}

					if ($submenus.hasClass(OPEN_CLASS)) {
						$overlay.addClass('has-opened-submenu');

						tl.to($submenuButton, 0.3, {
							autoAlpha: 1,
							x: '0px'
						}, '-=0.4');
					} else {
						$overlay.removeClass('has-opened-submenu');

						tl.to($submenuButton, 0.3, {
							autoAlpha: 0,
							x: '-10px'
						}, '-=0.4');
					}

				}
			], '0')
			.add(hideWords($currentLinks, 1.2, 0, '50px', true, '0.2'))
			.add(animateWords($submenuLinks, 0.4, 0.005), '-=0.6')
			.set($submenu, {
				zIndex: 100
			})
			.add(function () {
				$allLinks.removeClass(SELECTED_CLASS);
				$overlay.removeClass('intransition lockhover');
			}, '-=0.6');
	}

	function closeSubmenu($submenu, $currentMenu) {

		var
			$currentLinks = $currentMenu.find('> li > a .menu-overlay__item-wrapper'),
			$submenuLinks = $submenu.find('> li > a .menu-overlay__item-wrapper');

		tl
			.clear()
			.add([
				TweenMax.set($submenu, {
					zIndex: -1
				}),
				function () {

					$overlay.addClass('intransition lockhover');
					$submenus.removeClass(OPEN_CLASS);
					$currentMenu.not($menu).addClass(OPEN_CLASS);

					if (Modernizr.mq('(max-width: 991px)')) {
						if ($submenus.hasClass(OPEN_CLASS)) {
							hideLines($widgets, 0.6);
						} else {
							animateLines($widgets, 0.4, 0.02, 0.4);
						}
					}

					if ($submenus.hasClass(OPEN_CLASS)) {
						$overlay.addClass('has-opened-submenu');

						TweenMax.to($submenuButton, 0.3, {
							autoAlpha: 1,
							x: '0px'
						});
					} else {
						$overlay.removeClass('has-opened-submenu');

						TweenMax.to($submenuButton, 0.3, {
							autoAlpha: 0,
							x: '-10px'
						});
					}

				}
			])
			.add(hideWords($submenuLinks, 0.6, 0.005, '-50px'))
			.add(animateWords($currentLinks), '-=0.4')
			.add([
				TweenMax.set($submenu, {
					autoAlpha: 0
				}),
				function () {
					$overlay.removeClass('intransition lockhover');
				}
			], '-=0.6');
	}

	$links.on('click', function (e) {

		e.preventDefault();

		if (!$overlay.hasClass('intransition')) {

			var
				$el = $(this),
				$currentMenu = $el.parents('ul'),
				$submenu = $el.next('.sub-menu');

			$el.addClass(SELECTED_CLASS);
			openSubmenu($submenu, $currentMenu);
		}

	});

	$submenuButton.on('click', function (e) {

		e.preventDefault();

		if (!$overlay.hasClass('intransition')) {

			var $openedMenu = $submenus.filter('.' + OPEN_CLASS),
				$prevMenu = $openedMenu.parent('li').parent('ul');
			closeSubmenu($openedMenu, $prevMenu);

		}
	});

	$allLinks
		.on('mouseenter touchstart', function () {

			if ($submenus.filter('.opened').length) {
				$submenus.filter('.opened').addClass(HOVER_CLASS);
			} else {
				$menu.addClass(HOVER_CLASS);
			}

		})
		.on('mouseleave touchend', function () {

			$('.menu-overlay_hover').removeClass(HOVER_CLASS);

		});
}




/*!========================================================================
	28. Smooth Scroll
	======================================================================!*/
var SmoothScroll = function () {

	var $smoothScroll = $('#js-smooth-scroll');

	// don't launch on mobiles
	if (!$smoothScroll.length || Modernizr.touchevents) {
		return;
	}

	$smoothScroll.addClass('smooth-scroll');

	if (window.theme.smoothScroll.plugins.edgeEasing) {
		Scrollbar.use(window.EdgeEasingPlugin);
	}

	window.SB = Scrollbar.init($smoothScroll[0], window.theme.smoothScroll);

	// handle smooth anchor scrolling
	$('a[href^=\\#]:not([href=\\#])').each(function () {

		var
			$current = $(this),
			$el = $($current.attr('href'));

		if ($el.length) {
			$current.on('click', function () {
				window.SB.scrollIntoView($el.get(0));
			});
		}

	});


}

/*!========================================================================
	29. Create OS Scene
	======================================================================!*/
function createOSScene($el, tl, $customTrigger, noReveal) {

	var
		$trigger = $el,
		masterTL = new TimelineMax();

	if ($customTrigger && $customTrigger.length) {
		$trigger = $customTrigger;
	}

	if (!noReveal) {
		// reveal hidden element first
		masterTL.add(TweenMax.set($el, {
			autoAlpha: 1
		}));
	}

	masterTL.add(tl);

	masterTL.add(function () {
		$el.attr('data-os-animation', 'animated');
	});

	var scene = new $.ScrollMagic.Scene({
			triggerElement: $trigger,
			triggerHook: window.SMSceneTriggerHook,
			reverse: window.SMSceneReverse
		})
		.setTween(masterTL)
		.addTo(window.SMController);


	// update scene when smooth scroll is enabled
	if (window.SB !== undefined) {

		window.SB.addListener(function () {
			scene.refresh();
		});

	}

}

/*!========================================================================
	30. Get Scroll Stop
	======================================================================!*/
function getScrollTop() {
	if (window.SB !== undefined) {
		window.lastTop = window.SB.scrollTop;
	} else {
		window.lastTop = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
	}
	return window.lastTop;
}





/*!========================================================================
	35. Section Content
	======================================================================!*/
var SectionContent = function ($scope) {

	var $target = $scope.find('.section-content[data-os-animation]');

	if (!$target.length) {

		return;

	}

	$target.each(function () {

		var
			tl = new TimelineMax(),
			$current = $(this),
			$headline = $current.find('.section__headline'),
			$headlineProperty = $current.find('.figure-property__headline'),
			$heading = $current.find('h2'),
			$subheading = $current.find('h3'),
			$property = $current.find('.figure-property');

		prepare();
		animate();

		function prepare() {

			hideWords($heading, 0.6, 0.02, '50px');

			TweenMax.set($headlineProperty, {
				scaleX: 0,
				transformOrigin: 'left center'
			});

			TweenMax.set($headline, {
				scaleX: 0,
				transformOrigin: 'left center'
			});

		}

		function animate() {

			if ($heading.length) {

				tl.add(animateWords($heading));

			}
			if ($headline.length) {

				tl.to($headline, 1.2, {
					scaleX: 1,
					ease: Expo.easeInOut
				}, '0');

			}

			if ($subheading.length) {

				tl.add(animateLines($subheading, 0.4, 0.01), '-=0.8')

			}

			if ($property.length) {

				$property.each(function () {
					tl.add(animateLines($(this), 0.4, 0.01), '-=1.8');
					tl.to($(this).find($headlineProperty), 1.2, {
						scaleX: 1,
						ease: Expo.easeInOut,
						transformOrigin: 'left center'
					}, '0');
				});

			}

			createOSScene($current, tl);

		}

	})

}


/*!========================================================================
	37. Section Headings Slider
	======================================================================!*/
var SectionHeadingsSlider = function ($scope) {

	var $target = $scope.find('.section-headings-slider[data-os-animation]');

	if (!$target.length) {

		return;

	}

	var
		$slider = $target.find('.js-slider-headings'),
		$counter = $slider.find('.slider-headings__counter'),
		$heading = $slider.find('h2'),
		$prev = $slider.find('.slider-headings__arrow_prev .slider__arrow-inner'),
		$next = $slider.find('.slider-headings__arrow_next .slider__arrow-inner'),
		$dots = $slider.find('.slider__dots'),
		$backgrounds = $slider.find('.slider__background');

	prepare().then(function () {
		animate();
	})

	function prepare() {

		return new Promise(function (resolve, reject) {

			var tl = new TimelineMax();

			tl
				.add(function () {
					new SliderHeadings($slider);
				})
				.set($prev, {
					x: '-50px',
					autoAlpha: 0
				})
				.set($next, {
					x: '50px',
					autoAlpha: 0
				})
				.add(hideWords($heading, '0', '0', '-100px'))
				.set($counter, {
					autoAlpha: 0,
				})
				.set($dots, {
					autoAlpha: 0,
					y: '50px'
				})
				.add(function () {
					resolve(true);
				});

		});

	}

	function animate() {

		var tl = new TimelineMax();

		tl
			.add(animateWords($slider.find('.swiper-slide-active h2'), 0.4, 0.01, true), '0')
			.to([$prev, $next], 0.4, {
				autoAlpha: 1,
				x: '0px'
			}, '0')
			.to($dots, 0.4, {
				autoAlpha: 1,
				y: '0px'
			}, '0')
			.to($counter, 0.4, {
				autoAlpha: 1,
			}, '0.3')
			.add(function () {
				new SliderBackgrounds($backgrounds);
			}, '0.6');

		createOSScene($target, tl);

	}


}

/*!========================================================================
	41. Section Text Slider
	======================================================================!*/
var SectionTextSlider = function ($scope) {

	var $target = $scope.find('.section-text-slider[data-os-animation]');

	if (!$target.length) {

		return;

	}

	var
		$slider = $target.find('.js-slider-text'),
		$backgrounds = $slider.find('.slider__background'),
		$helper = $target.find('.slider-text__helper'),
		$helperNormal = $target.find('.slider-text__helper-label-normal'),
		$helperView = $target.find('.slider-text__helper-label-view'),
		$helperIconLeft = $slider.find('.slider-text__helper-icon_left'),
		$helperIconRight = $slider.find('.slider-text__helper-icon_right');

	prepare().then(function () {
		animate();
	});

	function prepare() {

		return new Promise(function (resolve, reject) {

			var tl = new TimelineMax();

			tl
				.set($helper, {
					y: '20px',
					autoAlpha: 0
				})
				.set($target.find('.slider-text__line'), {
					transformOrigin: 'left center',
					scaleX: 0
				})
				.add(hideWords($target.find('h2'), '0', '0', '-30px', true))
				.add(hideWords($target.find('.slider-text__counter'), '0', '0', '-30px', true))
				.add(hideWordsVertical($helperNormal, '0', '0', '10px'))
				.add(hideWordsVertical($helperView, '0', '0', '10px'))
				.add(function () {
					new SliderText($slider);
				})
				.add(function () {
					resolve(true);
				});

		});

	}

	function animate() {

		var tl = new TimelineMax();

		tl
			.to($helper, 0.6, {
				autoAlpha: 1,
				y: '0px'
			})
			.add(animateWords($target.find('.slider-text__counter'), 0.4, 0.01, true), '0')
			.add(animateWords($helperNormal, 0.6, 0.01, true), '0')
			.add(animateWords($target.find('.slider-text__upper h2'), 0.4, 0.01), '0')
			.add(animateWords($target.find('.slider-text__lower h2'), 0.4, 0.01), '0')
			.staggerTo($target.find('.slider-text__line'), 0.6, {
				scaleX: 1,
				ease: Expo.easeInOut
			}, 0.01, '0')
			.add(function () {
				hoverBackgrounds();
				new SliderBackgrounds($backgrounds);
			}, '0.6');


		createOSScene($target, tl);

	}

	function hoverBackgrounds() {

		var tl = new TimelineMax();

		$document
			.on('mouseenter touchstart', '.slider-text a[data-slide-id]', function () {

				tl
					.clear()
					.set($helper, {
						className: '+=color-white'
					})
					.to($helperIconLeft, 0.6, {
						x: '30px',
						rotation: 180,
						ease: Expo.easeInOut
					}, '0')
					.to($helperIconRight, 0.6, {
						x: '-30px',
						rotation: 180,
						ease: Expo.easeInOut
					}, '0')
					.add(hideWordsVertical($helperNormal, 0.6, 0.01, '30px', true), '0')
					.add(animateWords($helperView, 0.4, 0.01, true), '-=0.6');

			})
			.on('mouseleave touchend', '.slider-text a[data-slide-id]', function () {

				tl
					.clear()
					.set($helper, {
						className: '-=color-white'
					})
					.to($helperIconLeft, 0.6, {
						x: '0px',
						rotation: 0,
						ease: Expo.easeInOut
					}, '0')
					.to($helperIconRight, 0.6, {
						x: '0px',
						rotation: 0,
						ease: Expo.easeInOut
					}, '0')
					.add(hideWordsVertical($helperView, 0.6, 0.01, '-30px'), '0')
					.add(animateWords($helperNormal, 0.4, 0.01), '-=0.6');

			});

	}

}



/*!========================================================================
	44. Slider Half Screen
	======================================================================!*/
var SliderHalfScreen = function ($slider) {

	if (!$slider.length) {
		return;
	}

	var
		$heading = $slider.find('h2'),
		$description = $slider.find('p'),
		$link = $slider.find('.slider-halfscreen__wrapper-link'),
		tl = new TimelineMax(),
		$sliderImg = $slider.find('.js-slider-halfscreen__images'),
		$sliderContent = $slider.find('.js-slider-halfscreen__content'),
		overlapFactor = $sliderImg.data('overlap-factor') || 0;

	createSliders();
	hoverLinks();

	function createSliders() {

		var sliderImg = new Swiper($sliderImg, {
			autoplay: {
				enabled: $sliderImg.data('autoplay-enabled') || false,
				delay: $sliderImg.data('autoplay-delay') || 6000,
				disableOnInteraction: true
			},
			direction: 'vertical',
			preloadImages: true,
			lazy: {
				loadPrevNext: true,
				loadOnTransitionStart: true
			},
			speed: $sliderImg.data('speed') || 0,
			simulateTouch: false,
			allowTouchMove: true,
			watchSlidesProgress: true,
			on: {
				progress: function () {
					var swiper = this;
					for (var i = 0; i < swiper.slides.length; i++) {

						var slideProgress = swiper.slides[i].progress,
							innerOffset = swiper.width * overlapFactor,
							innerTranslate = slideProgress * innerOffset;

						try {
							TweenMax.set(swiper.slides[i].querySelector('.slider-halfscreen__bg'), {
								y: innerTranslate + 'px',
								transition: swiper.params.speed + 'ms',
								rotationZ: 0.01,
								force3D: true
							});
						} catch (error) {

						}

					}
				},
				touchStart: function () {
					var swiper = this;
					for (var i = 0; i < swiper.slides.length; i++) {
						try {
							TweenMax.set(swiper.slides[i].querySelector('.slider-halfscreen__bg'), {
								transition: '',
								rotationZ: 0.01,
								force3D: true
							});
						} catch (error) {

						}

					}
				},
			}
		});

		var sliderContent = new Swiper($sliderContent, {
			simulateTouch: false,
			direction: 'vertical',
			effect: 'fade',
			fadeEffect: {
				crossFade: true
			},
			mousewheel: {
				enabled:true,
				eventsTargeT: '.page-wrapper',
				releaseOnEdges: true,
			},
			keyboard: {
				enabled: true
			},
			navigation: {
				nextEl: '.js-slider-halfscreen__next',
				prevEl: '.js-slider-halfscreen__prev',
			},
			speed: $sliderImg.data('speed') || 0,
			allowTouchMove: true,
			breakpoints: {
				992: {
					autoHeight: true
				}
			}
		});

		sliderContent.update();

		sliderContent.on('slideChange', () => {

			if (sliderContent.realIndex > sliderContent.previousIndex) {
				slideChangeTransition('next');
			}

			if (sliderContent.realIndex < sliderContent.previousIndex) {
				slideChangeTransition('prev');
			}

		});

		function slideChangeTransition(direction = 'next') {
  var
    $activeSlide = $(slider.slides[slider.realIndex]),
    $activeDescription = $activeSlide.find($description),
    $activeHeading = $activeSlide.find($heading);

  tl.clear();

  // Mostrar instantáneamente
  $activeHeading.css({ opacity: 1, transform: 'none' });
  $activeDescription.css({ opacity: 1, transform: 'none' });
}

  tl.clear();

  // Ocultar elementos salientes instantáneamente
  $heading.each(function () {
    tl.to($(this), 0, {
      y: direction === 'next' ? '-15px' : '15px',
      autoAlpha: 0,
      ease: Power2.easeIn
    }, '0');
  });

  $description.each(function () {
    tl.to($(this), 0, {
      y: 10,
      autoAlpha: 0,
      ease: Power2.easeIn
    }, '0');
  });

  $link && $link.each(function () {
    tl.to($(this), 0, {
      y: 10,
      autoAlpha: 0,
      ease: Power2.easeIn
    }, '0');
  });

  // Mostrar elementos entrantes instantáneamente
  $activeHeading.css({ opacity: 1, transform: 'none' });
  $activeDescription.css({ opacity: 1, transform: 'none' });
  $activeLink && $activeLink.css({ opacity: 1, transform: 'none' });
}

	function hoverLinks() {

		$document
			.on('mouseenter touchstart', '.slider-halfscreen__link', function () {

				var $targetBackground = $sliderImg.find('.swiper-slide-active .slider-halfscreen__images-slide-inner'),
					$linkLine = $sliderContent.find('.swiper-slide-active .slider-halfscreen__link-line');

				if (!$targetBackground.length) {
					return;
				}

				TweenMax.to($targetBackground, 0.6, {
					scale: 1.05,
					ease: Expo.easeInOut
				});

				TweenMax.to($linkLine, 0.6, {
					width: '70px',
					ease: Expo.easeInOut
				});

			})
			.on('mouseleave touchend', '.slider-halfscreen__link', function () {

				var $targetBackground = $sliderImg.find('.swiper-slide-active .slider-halfscreen__images-slide-inner'),
					$linkLine = $sliderContent.find('.swiper-slide-active .slider-halfscreen__link-line');

				if (!$targetBackground.length) {
					return;
				}

				TweenMax.to($targetBackground, 0.6, {
					scale: 1,
					ease: Expo.easeInOut
				});

				TweenMax.to($linkLine, 0.6, {
					width: '60px',
					ease: Expo.easeInOut
				});

			});

	}

}

/*!========================================================================
	45. Slider Headings
	======================================================================!*/
var SliderHeadings = function ($slider) {

  if (!$slider.length) {
    return;
  }

var
  $heading = $slider.find('h2'),
  $description = $slider.find('p'),
  tl = new TimelineMax(),
  mobileMQ = window.matchMedia('(max-width: 767px)'),
  slider = new Swiper($slider[0], { 
    // En móvil se desliza hacia arriba/abajo (como Instagram); en escritorio, lateral
    direction: mobileMQ.matches ? 'vertical' : 'horizontal',
    simulateTouch: false,
    allowTouchMove: true,
    effect: 'fade',
    fadeEffect: {
      crossFade: true
    },
    speed: 350,
    centeredSlides: true,
    mousewheel: false, // la rueda se gestiona abajo: un gesto = una diapositiva
    keyboard: {
      enabled: true
    },
    pagination: {
      el: '.js-slider-headings__dots',
      clickable: true,
      bulletElement: 'div',
      bulletClass: 'slider__dot',
      bulletActiveClass: 'slider__dot_active'
    },
    navigation: {
      nextEl: '.js-slider-headings__next',
      prevEl: '.js-slider-headings__prev',
    },
    breakpoints: {
      768: {
        slidesPerView: 1,
        centeredSlides: true,
      }
    }
  });

  window.sliderHeadingsInstance = slider;

  // Rueda/trackpad: un gesto avanza una sola diapositiva. Tras cada salto se ignora la
  // inercia hasta que la rueda se detiene, para que no pase de golpe por varias páginas.
  (function () {
    var acc = 0, lastEvent = 0, lockedAt = 0, locked = false;
    $slider[0].addEventListener('wheel', function (e) {
      e.preventDefault();
      var now = Date.now(), gap = now - lastEvent;
      lastEvent = now;
      if (locked) {
        if (now - lockedAt > 600 && gap > 120) { locked = false; acc = 0; }
        else return;
      }
      if (gap > 250) acc = 0;
      acc += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(acc) >= 50) {
        if (acc > 0) slider.slideNext(); else slider.slidePrev();
        locked = true;
        lockedAt = now;
        acc = 0;
      }
    }, { passive: false });
  })();

  // Si se cruza el breakpoint (girar el móvil, redimensionar), recarga para cambiar la dirección
  var onBreakpointChange = function () { window.location.reload(); };
  if (mobileMQ.addEventListener) { mobileMQ.addEventListener('change', onBreakpointChange); }
  else { mobileMQ.addListener(onBreakpointChange); }
  

  // ===============================
// Enlaces por data-slide (menú top)
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".slider-nav-top button[data-slide]");
  const swiperInstance = window.sliderHeadingsInstance;

  if (!swiperInstance) {
    console.warn("Swiper no está inicializado aún.");
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const slideId = this.getAttribute("data-slide");
      const slides = document.querySelectorAll(".swiper-slide");

      // Buscar el índice de la slide con id o data-slide coincidente
      const index = Array.from(slides).findIndex((slide) =>
        slide.getAttribute("id") === slideId || slide.getAttribute("data-slide") === slideId
      );

      if (index !== -1) {
        swiperInstance.slideTo(index);
      } else {
        console.warn(`No se encontró el slide con id o data-slide="${slideId}"`);
      }
    });
  });
});


  updateVisibleDots(); // ← Ejecutar al iniciar
  
slider.on('slideChangeTransitionStart', () => {
  updateVisibleDots();

  if (slider.realIndex > slider.previousIndex) {
    slideChangeTransition('next');
  }

  if (slider.realIndex < slider.previousIndex) {
    slideChangeTransition('prev');
  }
});

  function updateVisibleDots() {
  const allDots = document.querySelectorAll('.slider__dot');
  const currentIndex = slider.realIndex;
  const total = allDots.length;

  let start = Math.max(currentIndex - 5, 0);
  let end = Math.min(start + 10, total);

  if (end - start < 10) {
    start = Math.max(end - 10, 0);
  }

  allDots.forEach((dot, i) => {
    dot.classList.remove('_visible');
    if (i >= start && i < end) {
      dot.classList.add('_visible');
    }
  });
}

  function slideChangeTransition(direction = 'next') {
  var
    $activeSlide = $(slider.slides[slider.realIndex]),
    $activeDescription = $activeSlide.find($description),
    $activeHeading = $activeSlide.find($heading);

  tl.clear();

  $heading.each(function () {
    tl
      .add(hideWords($(this), 0, 0.01, direction === 'next' ? '50px' : '-50px', direction === 'next' ? true : false), '0')
      .add(hideWords($heading, 0, 0.01, direction === 'next' ? '-50px' : '50px'));
  });

  $description.each(function () {
    tl.add(hideLines($(this), 0, 0.01, '100%', true), '0');
  });

  tl
    .add(animateWords($activeHeading, 0, 0.01, direction === 'next' ? true : false))
    .add(animateLines($activeDescription, 0, 0.01, direction === 'next' ? true : false), '-=0.4');
}

  renderSliderCounter(
    slider,
    $slider.find('.js-slider-headings-counter-current'),
    'slider-headings__counter-number',
    ''
  );

}


/*!========================================================================
	46. Slider Images
	======================================================================!*/
var SliderImages = function ($scope) {

	var $slider = $scope.find('.js-slider-images');

	if (!$slider.length) {
		return;
	}

	$slider.each(function () {

		var $current = $(this);

		var
			breakpoints = {},
			lg = window.elementorFrontend ? window.elementorFrontend.config.breakpoints.lg - 1 : 1024,
			md = window.elementorFrontend ? window.elementorFrontend.config.breakpoints.md - 1 : 767;

		breakpoints[lg] = {
			slidesPerView: $current.data('slides-per-view-tablet') || 1.33,
			spaceBetween: $current.data('space-between-tablet') || 30,
			centeredSlides: $current.data('centered-slides-tablet') || true,
		};
		breakpoints[md] = {
			slidesPerView: $current.data('slides-per-view-mobile') || 1.33,
			spaceBetween: $current.data('space-between-mobile') || 30,
			centeredSlides: $current.data('centered-slides-mobile') || true,
		};

		var slider = new Swiper($current, {
			autoHeight: $current.data('auto-height') || false,
			speed: $current.data('speed') || 0,
			preloadImages: false,
			lazy: {
				loadPrevNext: true,
				loadOnTransitionStart: true
			},
			watchSlidesProgress: true,
			watchSlidesVisibility: true,
			centeredSlides: $current.data('centered-slides') || false,
			slidesPerView: $current.data('slides-per-view') || 1.5,
			autoplay: {
				enabled: $current.data('autoplay-enabled') || false,
				delay: $current.data('autoplay-delay') || 6000,
			},
			spaceBetween: $current.data('space-between') || 80,
			pagination: {
				el: '.js-slider-images-progress',
				type: 'progressbar',
				progressbarFillClass: 'slider__progressbar-fill',
				renderProgressbar: function (progressbarFillClass) {
					return '<div class="' + progressbarFillClass + '"></div>'
				}
			},
			navigation: {
				nextEl: '.js-slider-images__next',
				prevEl: '.js-slider-images__prev',
			},
			breakpoints: breakpoints
		});

		// update height after images are loaded
		slider.on('lazyImageReady', function () {
			slider.update();
		});

		renderSliderCounter(
			slider,
			$current.find('.js-slider-images-counter-current'),
			'',
			$current.find('.js-slider-images-counter-total')
		);

	});

}


/*!========================================================================
	50. Animate Lines
	======================================================================!*/
function animateLines($target, duration = 0.4, stagger = 0.01, offset = '-=0.6') {

	var
		tl = new TimelineMax(),
		$headlineProperty = $target.find('.figure-property__headline'),
		$words = $target.find('.split-text__word');

	if ($headlineProperty.length) {

		tl
			.to($headlineProperty, duration, {
				ease: Expo.easeOut,
				scaleX: 1
			}, '0');

	}

	if ($words.length) {

		tl
			.staggerTo($words, duration, {
				y: '0%',
				ease: Power3.easeOut,
				autoAlpha: 1,
			}, stagger, offset);

	};

	return tl;

}

/*!========================================================================
	51. Animate Words
	======================================================================!*/
function animateWords($target, duration = 0.4, stagger = 0.01, reverse, masterStagger) {

	var masterTL = new TimelineMax();

	if ($target.length) {

		$target.each(function () {

			var
				tl = new TimelineMax(),
				$chars = $(this).find('.split-chars__char');

			if (reverse) {
				$chars = $chars.get().reverse();
			}

			if (!masterStagger) {
				masterStagger = '-=' + duration;
			}

			tl.staggerTo($chars, duration, {
				x: '0px',
				y: '0px',
				autoAlpha: 1,
				ease: Power4.easeOut
			}, stagger);

			masterTL.add(tl, masterStagger);

		});

	};

	return masterTL;

}

/*!========================================================================
	52. Do Split Text
	======================================================================!*/
function doSplitText($target) {

	var
		$words = $($target).find('.split-text'),
		$chars = $($target).find('.split-chars');

	return new Promise(function (resolve, reject) {

		if ($words.length) {

			TweenMax.set($words, {
				autoAlpha: 1,
			});

			new SplitText($words, {
				type: 'words, lines',
				linesClass: 'split-text__line',
				wordsClass: 'split-text__word',
			});

		}

		if ($chars.length) {

			TweenMax.set($chars, {
				autoAlpha: 1,
			});

			new SplitText($chars, {
				type: 'words, chars',
				// linesClass: 'split-chars__line',
				wordsClass: 'split-text__word',
				charsClass: 'split-chars__char'
			});


		}

		resolve(true);

	});

}

/*!========================================================================
	53. Hide Lines
	======================================================================!*/
function hideLines($target, duration = 0.6, stagger = 0.01, offset = '-100%', reverse) {

	var
		tl = new TimelineMax(),
		$words = $target.find('.split-text__word');

	if (reverse) {
		$words = $words.get().reverse();
	}

	if ($words.length) {

		tl.staggerTo($words, duration, {
			y: offset
		}, stagger);

	};

	return tl;

}

/*!========================================================================
	54. Hide Words
	======================================================================!*/
function hideWords($target, duration = 0.6, stagger = 0.01, offset = '-30px', reverse, masterStagger, direction = 'x') {

	var masterTL = new TimelineMax();

	if ($target.length) {

		$target.each(function () {

			var
				tl = new TimelineMax(),
				$chars = $(this).find('.split-chars__char'),
				options = {};

			if (reverse) {
				$chars = $chars.get().reverse();
			}

			if (!masterStagger) {
				masterStagger = '-=' + duration;
			}

			if (direction == 'x') {
				options = {
					x: offset,
					autoAlpha: 0
				};
			} else {
				options = {
					y: offset,
					autoAlpha: 0
				}
			}

			tl.staggerTo($chars, duration, options, stagger);

			masterTL.add(tl, masterStagger);
		});

	};

	return masterTL;

}


/*!========================================================================
	56. Set Lines
	======================================================================!*/
function setLines($target = $document, direction = 'vertical') {

	var
		$words = $target.find('.split-text .split-text__word'),
		$chars = $target.find('.split-chars .split-text__char');

	if (direction == 'vertical') {

		TweenMax.set($words, {
			y: '100%',
		});

		TweenMax.set($chars, {
			y: '100%',
		});

	} else {

		TweenMax.set($chars, {
			x: '50px',
			autoAlpha: 0
		});

	}

}

/*!========================================================================
	58. Fix Mobile Bar Height
	======================================================================!*/
function fixMobileBarHeight() {

	var vh;

	/**
	 * Initial set
	 */
	createStyleElement();
	setVh();

	/**
	 * Resize handling (with debounce)
	 */
	$(window).on('resize', debounce(function () {
		setVh();
	}, 250));

	/**
	 * 100vh elements height correction
	 */
	function setVh() {

		vh = window.innerHeight * 0.01;

		$('#rubenz-fix-bar').html(':root { --fix-bar-vh: ' + vh + 'px; }\n');

	}

	function createStyleElement() {

		if (!$('#rubenz-fix-bar').length) {
			$('head').append('<style id=\"rubenz-fix-bar\"></style>');
		}

	}

}

/*!========================================================================
	59. Run On High Performance GPU
	======================================================================!*/
function runOnHighPerformanceGPU() {

	var webGLCanvas = document.getElementById('js-webgl');

	if (typeof webGLCanvas !== 'undefined' && webGLCanvas !== null) {
		webGLCanvas.getContext('webgl', {
			powerPreference: 'high-performance'
		});
	}

}


})(jQuery);


function showPopup(name) {
  const popup = document.getElementById('popup');
  const popupContent = document.getElementById('popup-content');
  popupContent.textContent = name; // Muestra el nombre del talento
  popup.classList.add('active'); // Activa el pop-up
}

function closePopup() {
  const popup = document.getElementById('popup');
  popup.classList.remove('active'); // Oculta el pop-up
}


// ===============================
// Marca en <body> cuando se está en la última página del slider
// (oculta el botón fijo "Volver a OLGADEPALMA", que pasa a estar abajo)
// ===============================
(function () {
  function bindLastSlideClass() {
    const slider = window.sliderHeadingsInstance;
    if (!slider || !slider.on) return setTimeout(bindLastSlideClass, 200);
    const update = () => document.body.classList.toggle('is-last-slide', !!slider.isEnd);
    slider.on('slideChange', update);
    slider.on('transitionEnd', update);
    update();
  }
  bindLastSlideClass();
})();
