
const routes = [
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      {
        name: 'home',
        path: '',
        alias: 'index.html',
        component: () => import('pages/Index.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        name: 'login',
        path: 'auth',
        component: () => import('pages/Auth.vue'),
        meta: {
          requiresAuth: false
        }
      },
      {
        name: 'profile',
        path: 'profile',
        component: () => import('pages/Profile.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        name: 'files',
        path: 'files',
        component: () => import('pages/Files.vue'),
        meta: {
          requiresAuth: true
        }
      }
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
