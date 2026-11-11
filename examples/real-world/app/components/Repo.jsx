import { Link } from 'react-router'

export default function Repo({ repo, owner }) {
  const { login } = owner
  const { name, description } = repo

  return (
    <div className="Repo">
      <h3>
        <Link to={`/${login}/${name}`}>{name}</Link>
        {' by '}
        <Link to={`/${login}`}>{login}</Link>
      </h3>
      {description && <p>{description}</p>}
    </div>
  )
}
