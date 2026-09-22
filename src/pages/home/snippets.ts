/**
 * Code shown on the landing page. Keep these accurate: they should compile against the
 * real lathe API. examples/showcase in the lathe repository is the reference.
 */

export const schemaSnippet = `var Schema = s.New(s.Config{Dialect: s.Postgres, Output: "db", Migrations: "migrations"},
    s.Table("users",
        s.BigInt("id").PrimaryKey().AutoIncrement(),
        s.VarChar("email", 255).Unique(),
        s.Text("bio").Nullable(),
        s.Enum("role", "admin", "member").Default("member"),
        s.Timestamp("created_at").DefaultNow(),
    ),
    s.Table("posts",
        s.UUID("id").PrimaryKey().DefaultUUID(),
        s.BigInt("author_id").References("users", "id").OnDelete(s.Cascade),
        s.VarChar("title", 200),
    ),
)`

export const generatedSnippet = `// db/posts.gen.go  (generated, do not edit)
type Post struct {
    ID       uuid.UUID \`db:"id" json:"id"\`
    AuthorID int64     \`db:"author_id" json:"author_id"\`
    Title    string    \`db:"title" json:"title"\`
    Author   *User     \`db:"-" json:"author,omitempty"\` // loaded with With(db.Posts.Author)
}

var Posts = PostColumns{
    ID:    lathe.NewColumn[uuid.UUID]("posts", "id"),
    Title: lathe.NewColumn[string]("posts", "title"),
    // ...
}`

export const querySnippet = `user, err := client.Users.FindFirst().
    Where(db.Users.Email.Eq(email), db.Users.Role.Eq(db.UserRoleAdmin)).
    Exclude(db.Users.PasswordHash).
    With(db.Users.Posts.OrderBy(db.Posts.Title.Asc())).
    One(ctx)

// db.Users.Email.Eq(42) does not compile: Email is a Column[string].`

export const migrationSnippet = `-- lathe migrate diff init   ->  migrations/<timestamp>_init.up.sql
CREATE TABLE "posts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "author_id" BIGINT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_posts_author_id" FOREIGN KEY ("author_id")
    REFERENCES "users" ("id") ON DELETE CASCADE
);`

export const installSteps = [
  {
    title: 'Install the CLI',
    lang: 'bash',
    code: 'go install github.com/tobibamidele/lathe/cmd/lathe@latest',
  },
  {
    title: 'Add it to your module',
    lang: 'bash',
    code: 'go get github.com/tobibamidele/lathe@latest\nlathe init --dialect postgres',
  },
  {
    title: 'Generate and migrate',
    lang: 'bash',
    code: 'lathe generate\nlathe migrate diff init\nlathe migrate up --url "$DATABASE_URL"',
  },
] as const
