
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
        name: 'admin',
        path: 'admin',
        component: () => import('pages/Admin/Index.vue'),
        meta: {
          requiresAuth: true
        },
        children: [
          {
            path: 'users',
            name: 'adminListUsers',
            component: () => import('pages/Admin/Users.vue'),
            meta: {
              requiresAuth: true
            }
          },
          {
            path: 'user/add',
            name: 'adminNewUser',
            component: () => import('pages/Admin/NewUser.vue'),
            meta: {
              requiresAuth: true
            }
          }
        ]
      },
      {
        name: 'debug',
        path: 'debug',
        component: () => import('pages/Debug.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        name: 'browse',
        path: 'browse',
        component: () => import('pages/Browse.vue'),
        meta: {
          requiresAuth: true
        },
        children: [
          {
            path: '*',
            component: () => import('pages/Browse.vue'),
            meta: {
              requiresAuth: true
            }
          }
        ]
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
