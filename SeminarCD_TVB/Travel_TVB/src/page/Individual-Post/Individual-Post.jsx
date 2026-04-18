import React from 'react';
import { useParams } from 'react-router-dom'; // 1. Import useParams to read URL parameters
import SinglePost from '../../components/Single-Post/SinglePost'; // 2. Import the component that displays the post
import SmallPostArchive from '../../components/SmallPostArchive/SmallPostArchive';


const IndividualPost = () => {
    // 3. Get the dynamic 'slug' from the URL (e.g., from a URL like "/posts/:slug")
    const { slug } = useParams();

    return (
        <div className="individual-post-page">
            <SinglePost slug={slug} />
            <SmallPostArchive />
        </div>
    );
};

export default IndividualPost;