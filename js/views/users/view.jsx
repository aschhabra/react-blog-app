import React     from 'react';
import UserView  from 'appRoot/components/users/view';

export default React.createClass({
  render: function () {
    return (
      <div className="user-view">
        <UserView userId={this.props.params.userId} />
        <hr />
        <PostList user={this.props.params.userId} />
      </div>
    );
  }
});