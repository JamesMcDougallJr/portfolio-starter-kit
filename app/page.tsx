import { BlogPosts } from 'app/components/posts'

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        James McDougall
      </h1>
      <p className="mb-4">
        {`I'm a Software Engineer turned problem solver. 
        I love nothing more than spending time with my son and hiking in the beautiful Wasatch mountains, skiing, or
         traveling. To make a living I try and solve hard or tricky problems for people using the powers of computing 
         and algorithms. I have worked in Finance, SaSS, and marketing. I currently work in Defense where I design web 
         interfaces.`}
      </p>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  )
}
