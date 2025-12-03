// Shared Swup initialization and navigation update logic
(function() {
  if (typeof Swup === 'undefined') {
    setTimeout(arguments.callee, 50);
    return;
  }
  
  const HeadPlugin = window.SwupHeadPlugin;
  const swup = new Swup({
    containers: ['#swup'],
    plugins: [
      HeadPlugin ? new HeadPlugin({
        persistTags: 'style[data-swup], link[rel="stylesheet"]',
      }) : null,
    ].filter(Boolean),
    cache: true,
    animateHistoryBrowsing: true,
    animationSelector: '.transition-fade',
    animationScope: 'html',
  });

  // Function to update navbar and footer - fetch fresh HTML
  function updateNavbarAndFooter() {
    const currentUrl = window.location.pathname + window.location.search;
    
    fetch(currentUrl, { cache: 'no-store' })
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const newNavbar = doc.querySelector('nav');
        const newFooter = doc.querySelector('footer');
        
        if (newNavbar && newNavbar.innerHTML) {
          const currentNavbar = document.querySelector('nav');
          if (currentNavbar) {
            currentNavbar.outerHTML = newNavbar.outerHTML;
            if (window.Alpine) {
              window.Alpine.initTree(document.querySelector('nav'));
            }
          }
        } else {
          updateActiveNavItem();
        }
        
        if (newFooter && newFooter.innerHTML) {
          const currentFooter = document.querySelector('footer');
          if (currentFooter) {
            currentFooter.outerHTML = newFooter.outerHTML;
            if (window.Alpine) {
              window.Alpine.initTree(document.querySelector('footer'));
            }
          }
        }
      })
      .catch(error => {
        console.error('Error updating navbar/footer:', error);
      });
  }

  // Function to update active navigation item
  function updateActiveNavItem() {
    const currentUrl = window.location.pathname.replace(/\/$/, '') || '/';
    const navLinks = document.querySelectorAll('nav a[href]');
    
    navLinks.forEach(link => {
      if (link.closest('.flex-shrink-0')) {
        return;
      }
      
      const linkUrl = link.getAttribute('href').replace(/\/$/, '') || '/';
      let isActive = false;
      
      if (currentUrl === linkUrl) {
        isActive = true;
      } else if (linkUrl === '/' || linkUrl === '/ru') {
        isActive = (currentUrl === '/' || currentUrl === '/ru');
      } else if (linkUrl !== '/' && linkUrl !== '/ru' && currentUrl.startsWith(linkUrl + '/')) {
        isActive = true;
      } else if (linkUrl === '/news' && currentUrl.startsWith('/news/')) {
        isActive = true;
      } else if (linkUrl === '/ru/news' && currentUrl.startsWith('/ru/news/')) {
        isActive = true;
      } else if (linkUrl === '/careers' && currentUrl.startsWith('/careers/jobs/')) {
        isActive = true;
      } else if (linkUrl === '/ru/careers' && currentUrl.startsWith('/ru/careers/jobs/')) {
        isActive = true;
      }
      
      link.classList.remove('bg-accent/50', 'text-white', 'text-primary', 'font-semibold', 'bg-background', 'text-foreground', 'pointer-events-none', 'hover:bg-accent', 'hover:text-accent-foreground', 'focus:bg-accent', 'focus:text-accent-foreground');
      
      if (isActive) {
        link.classList.add('bg-accent/50', 'text-white', 'font-semibold', 'pointer-events-none');
        link.setAttribute('data-active', 'true');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.add('bg-background', 'text-foreground', 'hover:bg-accent', 'hover:text-accent-foreground', 'focus:bg-accent', 'focus:text-accent-foreground');
        link.removeAttribute('data-active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // Show loading skeleton during page transition
  swup.hooks.on('visit:start', () => {
    const loadingEl = document.getElementById('swup-loading');
    if (loadingEl) {
      loadingEl.classList.remove('hidden');
    }
  });
  
  // Scroll to top on page transition
  swup.hooks.on('content:replace', () => {
    window.scrollTo(0, 0);
  });

  // Update navbar and footer after page is loaded
  swup.hooks.on('visit:end', () => {
    const loadingEl = document.getElementById('swup-loading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
    setTimeout(() => {
      updateNavbarAndFooter();
    }, 50);
  });

  // Handle anchor links
  swup.hooks.on('link:anchor', ({ hash }) => {
    setTimeout(() => {
      const element = document.querySelector(hash);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  });
  
  // Make swup available globally
  window.swup = swup;
  
  // Update active nav on initial load
  updateActiveNavItem();
})();

