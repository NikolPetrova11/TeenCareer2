const balls = document.querySelectorAll('.ball');

function startCycle() {
    balls.forEach(ball => {
        ball.classList.remove('hide-all');
        ball.style.animation = 'none';
        ball.offsetHeight; // force reflow
        ball.style.animation = '';
    });

    // След 9 сек → всички изчезват
    setTimeout(() => {
        balls.forEach(ball => ball.classList.add('hide-all'));
    }, 9000);

    // След 10 сек (9 + 1) → нов цикъл
    setTimeout(startCycle, 9500);
}

startCycle();
function updateHeaderHeight() {
    const header = document.querySelector('header');
    document.documentElement.style.setProperty(
      '--header-height',
      header.offsetHeight + 'px'
    );
  }

  window.addEventListener('load', updateHeaderHeight);
  window.addEventListener('resize', updateHeaderHeight);
  
  