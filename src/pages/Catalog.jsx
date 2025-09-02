{/* กล่องรูปปก */}
<Link to={`/product/${p.id}`}>
  <figure className="cover-box">
    <img
      src={toImageURL(p.cover)}
      alt={p.title}
      loading="lazy"
      decoding="async"
      onLoad={(e) => { e.currentTarget.dataset.loaded = "true"; }}
      onError={(e) => {
        e.currentTarget.src = NO_IMAGE;
        e.currentTarget.dataset.loaded = "true";
      }}
    />
  </figure>
</Link>
