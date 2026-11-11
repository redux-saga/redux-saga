import { route } from '@react-router/dev/routes'

export default [route(':login', 'routes/user.jsx'), route(':login/:name', 'routes/repo.jsx')]
