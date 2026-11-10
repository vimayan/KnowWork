import http from './client.js';

/* ─────────────────────────────────────────────────
   AUTH  →  POST /auth/register|login|logout
            GET|PATCH /auth/me
            POST /auth/areas
   ───────────────────────────────────────────────── */
export const authApi = {
  register:    (data)        => http.post('/auth/register', data),
  login:       (data)        => http.post('/auth/login', data),
  logout:      ()            => http.post('/auth/logout'),
  me:          ()            => http.get('/auth/me'),
  updateMe:    (data)        => http.patch('/auth/me', data),
  selectAreas: (field_ids)   => http.post('/auth/areas', { field_ids }),
};

/* ─────────────────────────────────────────────────
   JOB CARDS  →  GET /job-cards
                 GET /job-cards/:slug
                 GET /job-cards/:id/section/:section
   ───────────────────────────────────────────────── */
export const jobCardsApi = {
  list:    (params = {}) => http.get('/job-cards', params),
  get:     (slug)        => http.get(`/job-cards/${slug}`),
  section: (id, section) => http.get(`/job-cards/${id}/section/${section}`),
  suggest: (body)        => http.post('/job-cards/suggest', body),
};

/* ─────────────────────────────────────────────────
   TRAJECTORY  →  GET /trajectory/:id/graph
                  GET /trajectory/:id/compare
                  GET /trajectory/:id/failure-map
                  GET /trajectory/nodes/:nodeId/outcomes
   ───────────────────────────────────────────────── */
export const trajectoryApi = {
  graph:      (id)          => http.get(`/trajectory/${id}/graph`),
  compare:    (id, types)   => http.get(`/trajectory/${id}/compare`, { types: types.join(',') }),
  failureMap: (id)          => http.get(`/trajectory/${id}/failure-map`),
  outcomes:   (nodeId)      => http.get(`/trajectory/nodes/${nodeId}/outcomes`),
};

/* ─────────────────────────────────────────────────
   SALARY  →  GET /salary/:id
              GET /salary/:id/percentiles
              GET /salary/:id/trend
              GET /salary/compare
              POST /salary/submit
   ───────────────────────────────────────────────── */
export const salaryApi = {
  index:       (id, params = {}) => http.get(`/salary/${id}`, params),
  percentiles: (id, country)     => http.get(`/salary/${id}/percentiles`, { country }),
  trend:       (id, months = 24) => http.get(`/salary/${id}/trend`, { months }),
  compare:     (ids = [])        => http.get('/salary/compare', { ids: ids.join(',') }),
  submit:      (data)            => http.post('/salary/submit', data),
};

/* ─────────────────────────────────────────────────
   PROFILES  →  GET /profiles
                GET|POST|PATCH /profiles/:id
                POST /profiles/:id/skills|work-history|learning-path
   ───────────────────────────────────────────────── */
export const profilesApi = {
  list:        (params = {}) => http.get('/profiles', params),
  get:         (id)          => http.get(`/profiles/${id}`),
  create:      (data)        => http.post('/profiles', data),
  update:      (id, data)    => http.patch(`/profiles/${id}`, data),
  addSkill:    (id, data)    => http.post(`/profiles/${id}/skills`, data),
  addWork:     (id, data)    => http.post(`/profiles/${id}/work-history`, data),
  addLearning: (id, data)    => http.post(`/profiles/${id}/learning-path`, data),
};

/* ─────────────────────────────────────────────────
   ROADMAPS  →  GET|POST /roadmaps
                GET /roadmaps/:id
                POST /roadmaps/:id/like
                GET|POST /roadmaps/:id/progress
   ───────────────────────────────────────────────── */
export const roadmapsApi = {
  list:         (params = {}) => http.get('/roadmaps', params),
  get:          (id)          => http.get(`/roadmaps/${id}`),
  create:       (data)        => http.post('/roadmaps', data),
  like:         (id)          => http.post(`/roadmaps/${id}/like`),
  getProgress:  (id)          => http.get(`/roadmaps/${id}/progress`),
  saveProgress: (id, data)    => http.post(`/roadmaps/${id}/progress`, data),
};

/* ─────────────────────────────────────────────────
   MENTORS  →  GET /mentors
               GET /mentors/:id
               POST /mentors/:id/book
               GET /mentors/sessions/mine
               POST /mentors/sessions/:id/review
   ───────────────────────────────────────────────── */
export const mentorsApi = {
  list:       (params = {}) => http.get('/mentors', params),
  get:        (id)          => http.get(`/mentors/${id}`),
  book:       (id, data)    => http.post(`/mentors/${id}/book`, data),
  mySessions: (params = {}) => http.get('/mentors/sessions/mine', params),
  review:     (sessId, data)=> http.post(`/mentors/sessions/${sessId}/review`, data),
};

/* ─────────────────────────────────────────────────
   COMMUNITY  →  GET /community
                 POST /community/:id/join
                 GET|POST /community/:id/posts
                 GET /community/:id/events
                 GET /community/:id/study-rooms
   ───────────────────────────────────────────────── */
export const communityApi = {
  list:        ()              => http.get('/community'),
  join:        (id)            => http.post(`/community/${id}/join`),
  posts:       (id, params)    => http.get(`/community/${id}/posts`, params),
  createPost:  (id, data)      => http.post(`/community/${id}/posts`, data),
  events:      (id)            => http.get(`/community/${id}/events`),
  studyRooms:  (id)            => http.get(`/community/${id}/study-rooms`),
};

/* ─────────────────────────────────────────────────
   EDUCATION  →  GET /education/:id/subjects|degrees|institutes
   ───────────────────────────────────────────────── */
export const educationApi = {
  subjects:   (id)          => http.get(`/education/${id}/subjects`),
  degrees:    (id)          => http.get(`/education/${id}/degrees`),
  institutes: (id, params)  => http.get(`/education/${id}/institutes`, params),
};

/* ─────────────────────────────────────────────────
   SOCIETY  →  GET /society/:id
   ───────────────────────────────────────────────── */
export const societyApi = {
  get: (id) => http.get(`/society/${id}`),
};

/* ─────────────────────────────────────────────────
   EMPLOYERS  →  GET /employers/:jobCardId
   ───────────────────────────────────────────────── */
export const employersApi = {
  list:      (jobCardId)        => http.get(`/employers/${jobCardId}`),
  reviews:   (jobCardId, empId) => http.get(`/employers/${jobCardId}/${empId}/reviews`),
  addReview: (jid, eid, data)   => http.post(`/employers/${jid}/${eid}/reviews`, data),
};

/* ─────────────────────────────────────────────────
   USERS  →  GET /users/me/subscriptions|saved-jobs|agenda
   ───────────────────────────────────────────────── */
export const usersApi = {
  subscriptions: () => http.get('/users/me/subscriptions'),
  savedJobs:     () => http.get('/users/me/saved-jobs'),
  saveJob:       (id) => http.post(`/users/me/saved-jobs/${id}`),
  unsaveJob:     (id) => http.delete(`/users/me/saved-jobs/${id}`),
  agenda:        () => http.get('/users/me/agenda'),
};

/* ─────────────────────────────────────────────────
   FEED  →  GET /feed  GET /feed/trending
   ───────────────────────────────────────────────── */
export const feedApi = {
  get:      (params = {}) => http.get('/feed', params),
  trending: ()             => http.get('/feed/trending'),
};

/* ─────────────────────────────────────────────────
   SEARCH  →  GET /search/job-cards?q=
              GET /search/profiles?q=
   ───────────────────────────────────────────────── */
export const searchApi = {
  jobCards: (params = {}) => http.get('/search/job-cards', params),
  profiles: (params = {}) => http.get('/search/profiles', params),
};

/* ─────────────────────────────────────────────────
   GOALS  →  GET /users/me/goals
             POST /users/me/goals
             PATCH /users/me/goals/:id
             DELETE /users/me/goals/:id
             POST /users/me/goals/:id/milestones
             PATCH /users/me/goals/:id/milestones/:mid
   ───────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────
   ROADMAP PROGRESS  →  GET /users/me/roadmap-progress/:slug
                        PATCH /users/me/roadmap-progress/:slug
   ───────────────────────────────────────────────── */
export const roadmapProgressApi = {
  get:    (slug)        => http.get(`/users/me/roadmap-progress/${encodeURIComponent(slug)}`),
  update: (slug, data)  => http.patch(`/users/me/roadmap-progress/${encodeURIComponent(slug)}`, data),
};

export const goalsApi = {
  list:               ()                => http.get('/users/me/goals'),
  create:             (data)            => http.post('/users/me/goals', data),
  update:             (id, data)        => http.patch(`/users/me/goals/${id}`, data),
  remove:             (id)              => http.delete(`/users/me/goals/${id}`),
  addMilestone:       (id, data)        => http.post(`/users/me/goals/${id}/milestones`, data),
  updateMilestone:    (id, mid, data)   => http.patch(`/users/me/goals/${id}/milestones/${mid}`, data),
};

/* ─────────────────────────────────────────────────
   STORIES  →  GET /stories
               GET /stories/:id
               POST /stories/journey
               POST /stories/:id/like
   ───────────────────────────────────────────────── */
export const storiesApi = {
  list:          (params = {}) => http.get('/stories', params),
  get:           (id)          => http.get(`/stories/${id}`),
  submitJourney: (data)        => http.post('/stories/journey', data),
  like:          (id)          => http.post(`/stories/${id}/like`),
};
