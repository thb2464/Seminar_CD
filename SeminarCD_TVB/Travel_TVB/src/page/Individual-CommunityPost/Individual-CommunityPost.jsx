// src/pages/IndividualCommunityPost/IndividualCommunityPost.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import SingleCommunityPost from '../../components/SingleCommunityPost/SingleCommunityPost';

const IndividualCommunityPost = () => {
    const { slug } = useParams();

    return (
        <div className="individual-community-post-page">
            <SingleCommunityPost slug={slug} />
        </div>
    );
};

export default IndividualCommunityPost;
