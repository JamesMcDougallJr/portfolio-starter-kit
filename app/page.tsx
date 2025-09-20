import { BlogPosts } from 'app/components/posts'
import { ObjectDetectionPlayer } from './components/object_detector/object_detection_player'

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
         and algorithms. I have worked in Finance, SaSS, and Defense. I currently work in Defense where I am on a 
        frontend platform team enabling AI workflows on a complex user interface.`}
      </p>
      <div className="my-8">
        <BlogPosts />
      </div>
      <ObjectDetectionPlayer />
    </section>
  )
}
